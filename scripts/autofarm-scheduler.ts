#!/usr/bin/env tsx
/**
 * AutoFarm Scheduler v3.0 — Full Version
 * Features:
 *  - Adaptive backoff (smart cooldown)
 *  - Auto skip on 401 Unauthorized
 *  - Per-wallet dailyCap guard
 *  - Configurable via --config / --gap / --adaptive / --dry
 *  - CSV aggregator + log rotation (7 days)
 */

import fs from "fs";
import path from "path";
import axios, { AxiosError } from "axios";
import pLimit from "p-limit";
import chalk from "chalk";
import { updateLogSummary } from "./autofarm-logger";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const iso = () => new Date().toISOString();

/* ---------- Types ---------- */
type WalletConfig = { wallet: string; token?: string; dailyCapOverride?: number };
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
  pauseMsBetweenShots: number;
  gapMsBetweenBursts?: number;
  dailyCap: number;
  wallets: WalletConfig[];
  metaPrefix?: string;
  maxRetries: number;
  backoffBaseMs: number;
  backoffJitterMs: number;
  adaptiveMode?: boolean;
  adaptive?: AdaptiveCfg;
};

/* ---------- Arg Parser ---------- */
function getArgValue(flag: string): string | null {
  const i = process.argv.findIndex((a) => a === flag || a.startsWith(flag + "="));
  if (i === -1) return null;
  const eq = process.argv[i].split("=");
  if (eq.length > 1) return eq.slice(1).join("=");
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

/* ---------- Main ---------- */
async function main() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(chalk.red(`[ERROR] Config file not found: ${CONFIG_PATH}`));
    process.exit(1);
  }
  const cfg: Config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  if (GAP_OVERRIDE_STR) cfg.gapMsBetweenBursts = parseInt(GAP_OVERRIDE_STR, 10);
  if (ENABLE_ADAPTIVE) cfg.adaptiveMode = true;

  console.log(chalk.cyan(`[INFO] Loaded config file: ${CONFIG_PATH}`));
  console.log(chalk.cyan(`[INFO] ==============================================`));
  const session = `${cfg.metaPrefix || "dash"}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  console.log(chalk.cyan(`[INFO] 🚀 AutoFarm session: ${session}`));

  if (DRY_RUN) console.log(chalk.yellow("[INFO] DRY-RUN: No API calls"));
  if (cfg.adaptiveMode) console.log(chalk.yellow("[INFO] Adaptive mode enabled"));

  const summary: Record<string, any> = {};
  for (const w of cfg.wallets)
    summary[w.wallet] = { earned: 0, tried: 0, done: 0, lastError: null, skipped: false };

  /* -------- Single earn -------- */
  async function earnOnce(w: WalletConfig, attemptId: string) {
    if (DRY_RUN) return { ok: true, balance: 0 };
    const url = `${cfg.baseUrl}/api/points/earn`;
    let tries = 0;
    while (true) {
      tries++;
      try {
        const res = await axios.post(
          url,
          { type: cfg.farmType, amount: cfg.amountPerShot, meta: { session, attemptId } },
          { headers: { Authorization: `Bearer ${w.token}` }, timeout: 15000 }
        );
        return { ok: true, balance: res.data?.event?.balance ?? 0 };
      } catch (e) {
        const err = e as AxiosError<any>;
        const status = err.response?.status ?? 0;
        const msg = err.response?.data?.error || err.message;
        if (status === 401) return { ok: false, status, msg };
        if (tries <= cfg.maxRetries && (status === 429 || status >= 500)) {
          const jitter = Math.random() * cfg.backoffJitterMs;
          const wait = cfg.backoffBaseMs * Math.pow(1.6, tries - 1) + jitter;
          console.log(chalk.yellow(`[WARN] Retry ${tries}/${cfg.maxRetries} (${status}) → ${wait.toFixed(0)}ms`));
          await sleep(wait);
          continue;
        }
        return { ok: false, status, msg };
      }
    }
  }

  /* -------- Wallet loop -------- */
  for (const wallet of cfg.wallets) {
    const limit = pLimit(cfg.concurrency);
    const cap = wallet.dailyCapOverride ?? cfg.dailyCap;
    let pause = cfg.pauseMsBetweenShots;
    const win: number[] = [];

    if (!DRY_RUN && !wallet.token) {
      console.log(chalk.red(`[WARN] Wallet ${wallet.wallet} missing token → skip.`));
      summary[wallet.wallet].skipped = true;
      continue;
    }

    for (let burst = 1; burst <= cfg.bursts; burst++) {
      if (summary[wallet.wallet].earned >= cap || summary[wallet.wallet].skipped) break;

      const tasks = Array.from({ length: cfg.concurrency }, (_, i) =>
        limit(async () => {
          if (summary[wallet.wallet].earned >= cap) return;
          const attemptId = `${wallet.wallet}-${burst}-${i}`;
          summary[wallet.wallet].tried++;
          const r = await earnOnce(wallet, attemptId);
          if (r.ok) {
            summary[wallet.wallet].done++;
            summary[wallet.wallet].earned += cfg.amountPerShot;
            console.log(
              chalk.green(
                `[INFO] ✅ +${cfg.amountPerShot} (${wallet.wallet}) earned=${summary[wallet.wallet].earned}/${cap} bal=${r.balance}`
              )
            );
            win.push(200);
          } else {
            const s = r.status ?? 0;
            summary[wallet.wallet].lastError = r.msg;
            if (s === 401) {
              console.log(chalk.red(`[WARN] 401 Unauthorized → skip wallet ${wallet.wallet}`));
              summary[wallet.wallet].skipped = true;
            } else if (s === 429) console.log(chalk.yellow(`[WARN] ⚠️ 429 rate limit`));
            else console.log(chalk.red(`[WARN] ❌ ${s} ${r.msg}`));
            win.push(s);
          }
        })
      );
      await Promise.all(tasks);
      if (summary[wallet.wallet].skipped) break;

      // adaptive control
      if (cfg.adaptiveMode) {
        const wsize = cfg.adaptive?.windowSize ?? 20;
        const recent = win.slice(-wsize);
        const r429 = recent.filter((s) => s === 429).length / (recent.length || 1);
        if (r429 > (cfg.adaptive?.high429Ratio ?? 0.25)) {
          const cd = cfg.adaptive?.cooldownMs ?? 2000;
          console.log(chalk.yellow(`[ADAPT] Cooldown: ${(r429 * 100).toFixed(0)}% 429 → ${cd}ms`));
          await sleep(cd);
          pause = Math.min(pause + (cfg.adaptive?.step ?? 25), cfg.adaptive?.maxPause ?? 400);
        } else {
          pause = Math.max(pause - (cfg.adaptive?.step ?? 25), cfg.adaptive?.minPause ?? 120);
        }
      }
      console.log(chalk.gray(`[${wallet.wallet}] Burst ${burst}/${cfg.bursts} done → pause ${pause}ms`));
      await sleep(pause);
      if (cfg.gapMsBetweenBursts) await sleep(cfg.gapMsBetweenBursts);
    }
  }

  const totalEarned = Object.values(summary).reduce((a, s: any) => a + (s.earned || 0), 0);
  const totalShots = Object.values(summary).reduce((a, s: any) => a + (s.done || 0), 0);
  const totalFail = Object.values(summary).reduce((a, s: any) => a + ((s.tried || 0) - (s.done || 0)), 0);
  const result = {
    date: iso(),
    totals: { earned: totalEarned, successShots: totalShots, failedShots: totalFail },
    wallets: summary,
  };

  const logDir = path.join(process.cwd(), "scripts/logs");
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `${new Date().toISOString().split("T")[0]}.json`);
  fs.writeFileSync(logFile, JSON.stringify(result, null, 2));
  console.log(chalk.green(`📄 Saved summary → ${logFile}`));

  // log rotation & csv aggregator
  await updateLogSummary(logFile);

  console.log(
    chalk.cyan(
      `[INFO] 🌾 Done → success=${totalShots}, failed=${totalFail}, totalEarned=${totalEarned}`
    )
  );
}

main().catch((e) => console.error(chalk.red(`[FATAL] ${e.message}`)));
