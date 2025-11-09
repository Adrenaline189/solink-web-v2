#!/usr/bin/env tsx
/**
 * AutoFarm Scheduler — v2.1 (full)
 * - Robust --config arg parsing + verification log
 * - Per-wallet fail-fast on 401 (skip remaining shots for that wallet)
 * - True retry loop with exponential backoff + jitter
 * - Adaptive cooldown on heavy 429 bursts
 * - Per-wallet dailyCap guard
 * - Gap override (--gap) + --dry + --adaptive
 *
 * Author: Luminex x GPT-5
 */

import fs from "fs";
import path from "path";
import axios, { AxiosError } from "axios";
import pLimit from "p-limit";
import chalk from "chalk";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const iso = () => new Date().toISOString();

type WalletConfig = {
  wallet: string;
  token?: string;
  dailyCapOverride?: number; // optional: override global daily cap
};

type AdaptiveCfg = {
  windowSize: number;
  high429Ratio: number;
  cooldownMs: number;
  minPause: number;
  maxPause: number;
  step: number;
};

type Config = {
  baseUrl: string;
  farmType: string;
  amountPerShot: number;
  bursts: number;
  concurrency: number;
  pauseMsBetweenShots: number; // base pause between bursts
  gapMsBetweenBursts?: number; // extra wait between bursts/wallets
  dailyCap: number;            // global per-wallet daily cap
  wallets: WalletConfig[];
  metaPrefix?: string;

  // retry/backoff
  maxRetries: number;          // per request
  backoffBaseMs: number;
  backoffJitterMs: number;

  // adaptive
  adaptiveMode?: boolean;
  adaptive?: AdaptiveCfg;
};

// --------- Arg parsing (robust) ----------
function getArgValue(flag: string): string | null {
  const i = process.argv.findIndex((a) => a === flag || a.startsWith(flag + "="));
  if (i === -1) return null;
  const directEq = process.argv[i].split("=");
  if (directEq.length > 1) return directEq.slice(1).join("="); // --config=...
  if (process.argv[i + 1] && !process.argv[i + 1].startsWith("-")) return process.argv[i + 1];
  return null;
}

const DRY_RUN = process.argv.includes("--dry");
const ENABLE_ADAPTIVE = process.argv.includes("--adaptive");
const GAP_OVERRIDE_STR = getArgValue("--gap");
const CONFIG_ARG = getArgValue("--config");

const CONFIG_PATH = CONFIG_ARG
  ? path.isAbsolute(CONFIG_ARG)
    ? CONFIG_ARG
    : path.join(process.cwd(), CONFIG_ARG)
  : path.join(process.cwd(), "scripts/config/autofarm.config.json");

async function main() {
  // ----- Load config -----
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(chalk.red(`[ERROR] Config file not found: ${CONFIG_PATH}`));
    process.exit(1);
  }
  const cfg: Config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

  if (GAP_OVERRIDE_STR) cfg.gapMsBetweenBursts = parseInt(GAP_OVERRIDE_STR, 10);
  if (ENABLE_ADAPTIVE) cfg.adaptiveMode = true;

  console.log(chalk.cyan(`[${iso()}] [INFO] Loaded config file: ${CONFIG_PATH}`));
  console.log(chalk.cyan("[INFO] =============================================="));

  const session = `${cfg.metaPrefix || "dash"}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  console.log(chalk.cyan(`[INFO] 🚀 AutoFarm run started (session: ${session})`));
  console.log(
    chalk.cyan(
      `[INFO] baseUrl=${cfg.baseUrl} | type=${cfg.farmType} | amount=${cfg.amountPerShot} | bursts=${cfg.bursts} | conc=${cfg.concurrency} | cap=${cfg.dailyCap}`
    )
  );
  if (DRY_RUN) console.log(chalk.yellow("[INFO] DRY-RUN mode: requests will NOT hit the API."));
  if (cfg.adaptiveMode) console.log(chalk.yellow("[INFO] Adaptive mode: enabled"));

  // ----- Summary holders -----
  const perWalletSummary: Record<string, any> = {};
  for (const w of cfg.wallets) {
    perWalletSummary[w.wallet] = {
      wallet: w.wallet,
      token: w.token || "",
      earned: 0,
      shotsDone: 0,
      shotsTried: 0,
      lastBalance: 0,
      lastError: null,
      skipped: false,
    };
  }

  // helper: single earn attempt with retry/backoff
  async function earnOnce(w: WalletConfig, attemptId: string) {
    if (DRY_RUN) {
      await sleep(30);
      return { ok: true, balance: 0 };
    }

    const url = `${cfg.baseUrl}/api/points/earn`;
    let tries = 0;

    while (true) {
      tries++;
      try {
        const res = await axios.post(
          url,
          {
            type: cfg.farmType,
            amount: cfg.amountPerShot,
            meta: { session, attemptId, wallet: w.wallet },
          },
          { headers: { Authorization: `Bearer ${w.token}` }, timeout: 15_000 }
        );
        const bal = res.data?.event?.balance ?? 0;
        return { ok: true, balance: bal };
      } catch (e) {
        const err = e as AxiosError<any>;
        const status = err.response?.status ?? 0;
        const message =
          (err.response?.data?.error as string) ||
          err.message ||
          "Unknown error";
        // 401: do not retry
        if (status === 401) {
          return { ok: false, status, message };
        }
        // 429/5xx with retry
        if (tries <= cfg.maxRetries && (status === 429 || (status >= 500 && status < 600) || status === 0)) {
          const jitter = Math.random() * cfg.backoffJitterMs;
          const wait = cfg.backoffBaseMs * Math.pow(1.6, tries - 1) + jitter;
          console.log(chalk.yellow(`[WARN] ⏳ Retry ${tries}/${cfg.maxRetries} status=${status} → ${Math.round(wait)}ms`));
          await sleep(wait);
          continue;
        }
        return { ok: false, status, message };
      }
    }
  }

  // main loop per wallet
  for (const wallet of cfg.wallets) {
    const limit = pLimit(cfg.concurrency);
    let pauseBetweenBursts = cfg.pauseMsBetweenShots;
    const windowStatuses: number[] = []; // for adaptive window

    const walletCap = wallet.dailyCapOverride ?? cfg.dailyCap;

    // quick guard: missing token
    if (!DRY_RUN && !wallet.token) {
      console.log(chalk.red(`[WARN] Wallet ${wallet.wallet} has no token → skipping.`));
      perWalletSummary[wallet.wallet].lastError = "No token";
      perWalletSummary[wallet.wallet].skipped = true;
      continue;
    }

    // burst loop
    for (let burst = 1; burst <= cfg.bursts; burst++) {
      // cap check
      if (perWalletSummary[wallet.wallet].earned >= walletCap) {
        console.log(chalk.green(`[INFO] ${wallet.wallet} reached cap ${walletCap}. Stop.`));
        break;
      }
      if (perWalletSummary[wallet.wallet].skipped) break;

      const tasks = Array.from({ length: cfg.concurrency }, (_, idx) =>
        limit(async () => {
          // cap check inside concurrency
          if (perWalletSummary[wallet.wallet].earned >= walletCap) return;

          const shotNo = (burst - 1) * cfg.concurrency + idx + 1;
          const attemptId = `${wallet.wallet}-b${burst}-i${idx}-t${Date.now()}`;

          perWalletSummary[wallet.wallet].shotsTried++;
          const result = await earnOnce(wallet, attemptId);

          if (result.ok) {
            perWalletSummary[wallet.wallet].shotsDone++;
            perWalletSummary[wallet.wallet].earned += cfg.amountPerShot;
            perWalletSummary[wallet.wallet].lastBalance = result.balance;
            console.log(
              chalk.green(
                `[INFO] ✅ +${cfg.amountPerShot} (${wallet.wallet}) shots=${perWalletSummary[wallet.wallet].shotsDone}/${cfg.bursts * cfg.concurrency}, earned=${perWalletSummary[wallet.wallet].earned}/${walletCap} balance=${result.balance}`
              )
            );
            windowStatuses.push(200);
          } else {
            const status = result.status ?? -1;
            const msg = result.message ?? "error";
            perWalletSummary[wallet.wallet].lastError = msg;

            if (status === 401) {
              console.log(chalk.red(`[WARN] ❌ 401 Unauthorized for ${wallet.wallet} → skipping remaining for this wallet.`));
              perWalletSummary[wallet.wallet].skipped = true;
              windowStatuses.push(401);
            } else if (status === 429) {
              console.log(chalk.yellow(`[WARN] ⚠️ 429 (rate limit) ${wallet.wallet}`));
              windowStatuses.push(429);
            } else {
              console.log(chalk.red(`[WARN] ❌ ${status} ${msg}`));
              windowStatuses.push(status || 0);
            }
          }
        })
      );

      await Promise.all(tasks);

      // if wallet got marked skipped (e.g., 401), stop early
      if (perWalletSummary[wallet.wallet].skipped) break;

      // adaptive window check
      if (cfg.adaptiveMode) {
        const win = cfg.adaptive?.windowSize ?? 20;
        const slice = windowStatuses.slice(-win);
        const rate429 = slice.length
          ? slice.filter((s) => s === 429).length / slice.length
          : 0;
        const high = rate429 >= (cfg.adaptive?.high429Ratio ?? 0.2);
        if (high) {
          const cd = cfg.adaptive?.cooldownMs ?? 2000;
          console.log(chalk.yellow(`🧊 Cooldown: high 429 ratio (${(rate429 * 100).toFixed(0)}%) → sleep ${cd}ms`));
          await sleep(cd);
          pauseBetweenBursts = Math.min(
            (pauseBetweenBursts + (cfg.adaptive?.step ?? 20)),
            (cfg.adaptive?.maxPause ?? 400)
          );
        } else {
          // small relaxation
          pauseBetweenBursts = Math.max(
            pauseBetweenBursts - (cfg.adaptive?.step ?? 20),
            (cfg.adaptive?.minPause ?? 120)
          );
        }
      }

      console.log(
        chalk.gray(`[${wallet.wallet}] Burst ${burst}/${cfg.bursts} done | next pause=${pauseBetweenBursts}ms`)
      );
      await sleep(pauseBetweenBursts);

      // extra gap between bursts/wallet blocks
      if (cfg.gapMsBetweenBursts) {
        console.log(chalk.yellow(`🕓 Gap ${cfg.gapMsBetweenBursts}ms...`));
        await sleep(cfg.gapMsBetweenBursts);
      }
    }
  }

  // ----- Summary & log file -----
  const totals = {
    wallets: cfg.wallets.length,
    successShots: Object.values(perWalletSummary).reduce((a, w: any) => a + (w.shotsDone || 0), 0),
    failedShots: Object.values(perWalletSummary).reduce((a, w: any) => a + ((w.shotsTried || 0) - (w.shotsDone || 0)), 0),
    totalEarned: Object.values(perWalletSummary).reduce((a, w: any) => a + (w.earned || 0), 0),
  };

  const summary = {
    date: new Date().toISOString(),
    farmType: cfg.farmType,
    amountPerShot: cfg.amountPerShot,
    bursts: cfg.bursts,
    concurrency: cfg.concurrency,
    dailyCap: cfg.dailyCap,
    baseUrl: cfg.baseUrl,
    totals,
    perWallet: perWalletSummary,
  };

  const logDir = path.join(process.cwd(), "scripts/logs");
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `${new Date().toISOString().split("T")[0]}.json`);
  fs.writeFileSync(logFile, JSON.stringify(summary, null, 2));
  console.log(chalk.green(`📄 Saved summary → ${logFile}`));
  console.log(chalk.cyan(`[INFO] 🌾 Run done → successShots=${totals.successShots}, failedShots=${totals.failedShots}, totalEarned=${totals.totalEarned}`));
  console.log(chalk.cyan("[INFO] =============================================="));
}

main().catch((e) => {
  console.error(chalk.red(`[ERROR] ${e?.message || e}`));
  process.exit(1);
});
