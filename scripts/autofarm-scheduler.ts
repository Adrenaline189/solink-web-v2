#!/usr/bin/env tsx
/**
 * AutoFarm Scheduler v3.2 — Full Version (RPS limiter + Auto Token Refresh)
 *
 * - Global token-bucket rate limiter (configurable RPS)
 * - Auto refresh token on 401 via /api/auth/demo-login (optional)
 * - Adaptive backoff + dynamic concurrency throttle on heavy 429
 * - Per-wallet dailyCap guard
 * - CLI flags: --config, --gap, --adaptive, --dry
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
type WalletConfig = {
  wallet: string;
  token?: string;
  dailyCapOverride?: number;
  // internal
  _consecutive401?: number;
};

type AdaptiveCfg = {
  windowSize: number;
  high429Ratio: number;
  cooldownMs: number;
  minPause: number;
  maxPause: number;
  step: number;
};

type AuthCfg = {
  demoLogin?: boolean;          // if true, refresh token via /api/auth/demo-login
  maxRefreshRetries?: number;   // per wallet per run
};

type RateCfg = {
  rps: number;                  // global requests per second
  bucketSize: number;           // max burst tokens
  refillEveryMs: number;        // refill cadence
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
  auth?: AuthCfg;
  rate?: RateCfg;               // global rate limiter
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

/* ---------- Global Token Bucket (RPS limiter) ---------- */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  constructor(
    private capacity: number,
    private refillEveryMs: number,
    private tokensPerRefill: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  async take(): Promise<void> {
    while (true) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      await sleep(this.refillEveryMs / 2);
    }
  }
  private refill() {
    const now = Date.now();
    if (now - this.lastRefill >= this.refillEveryMs) {
      const refills = Math.floor((now - this.lastRefill) / this.refillEveryMs);
      this.tokens = Math.min(this.capacity, this.tokens + refills * this.tokensPerRefill);
      this.lastRefill += refills * this.refillEveryMs;
    }
  }
}

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
  const session = `${cfg.metaPrefix || "dash"}-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`;
  console.log(
    chalk.cyan(
      `[INFO] 🚀 AutoFarm run started (session: ${session})\n[INFO] baseUrl=${cfg.baseUrl} | type=${cfg.farmType} | amount=${cfg.amountPerShot} | bursts=${cfg.bursts} | conc=${cfg.concurrency} | cap=${cfg.dailyCap}`
    )
  );

  if (DRY_RUN) console.log(chalk.yellow("[INFO] DRY-RUN: No API calls"));
  if (cfg.adaptiveMode) console.log(chalk.yellow("[INFO] Adaptive mode enabled")));

  // Global rate limiter
  const rate = cfg.rate ?? { rps: 3, bucketSize: 6, refillEveryMs: 250 };
  const bucket = new TokenBucket(rate.bucketSize, rate.refillEveryMs, Math.max(1, Math.floor((rate.rps * rate.refillEveryMs) / 1000)));

  const summary: Record<string, any> = {};
  for (const w of cfg.wallets)
    summary[w.wallet] = { earned: 0, tried: 0, done: 0, lastError: null, skipped: false, tokenRefreshed: 0 };

  async function refreshTokenIfNeeded(w: WalletConfig): Promise<boolean> {
    if (!cfg.auth?.demoLogin) return false;
    const url = `${cfg.baseUrl}/api/auth/demo-login`;
    try {
      await bucket.take(); // respect rate limiter
      const res = await axios.post(url, { wallet: w.wallet }, { timeout: 10000 });
      const newToken = res.data?.token;
      if (newToken) {
        w.token = newToken;
        summary[w.wallet].tokenRefreshed++;
        console.log(chalk.blue(`[AUTH] Refreshed token for ${w.wallet} (${summary[w.wallet].tokenRefreshed})`));
        return true;
      }
      return false;
    } catch (e) {
      const msg = (e as AxiosError).message;
      console.log(chalk.red(`[AUTH] Failed to refresh token for ${w.wallet}: ${msg}`));
      return false;
    }
  }

  /* -------- Single earn -------- */
  async function earnOnce(w: WalletConfig, attemptId: string) {
    if (DRY_RUN) return { ok: true, balance: 0 };

    const url = `${cfg.baseUrl}/api/points/earn`;
    let tries = 0;
    while (true) {
      tries++;
      try {
        await bucket.take(); // throttle every request globally
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

        if (status === 401) {
          w._consecutive401 = (w._consecutive401 ?? 0) + 1;
          const maxR = cfg.auth?.maxRefreshRetries ?? 2;
          if (w._consecutive401 <= maxR) {
            console.log(chalk.yellow(`[WARN] 401 Unauthorized (${w.wallet}) → try token refresh ${w._consecutive401}/${maxR}`));
            const ok = await refreshTokenIfNeeded(w);
            if (ok) {
              // retry once immediately with new token
              continue;
            }
          }
          return { ok: false, status, msg };
        }

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
    const cap = wallet.dailyCapOverride ?? cfg.dailyCap;
    let pause = cfg.pauseMsBetweenShots;
    let currentConcurrency = cfg.concurrency;

    if (!DRY_RUN && !wallet.token && !cfg.auth?.demoLogin) {
      console.log(chalk.red(`[WARN] Wallet ${wallet.wallet} missing token and demoLogin disabled → skip.`));
      summary[wallet.wallet].skipped = true;
      continue;
    }
    if (!wallet.token && cfg.auth?.demoLogin) {
      const ok = await refreshTokenIfNeeded(wallet);
      if (!ok) console.log(chalk.red(`[WARN] Could not prefetch token for ${wallet.wallet}, will attempt on-demand.`));
    }

    // sliding window for 429 ratio
    const windowStatuses: number[] = [];

    for (let burst = 1; burst <= cfg.bursts; burst++) {
      if (summary[wallet.wallet].earned >= cap || summary[wallet.wallet].skipped) break;

      const limit = pLimit(currentConcurrency);
      const tasks = Array.from({ length: currentConcurrency }, (_, i) =>
        limit(async () => {
          if (summary[wallet.wallet].earned >= cap) return;
          const attemptId = `${wallet.wallet}-${burst}-${i}`;
          summary[wallet.wallet].tried++;
          const r = await earnOnce(wallet, attemptId);
          if (r.ok) {
            wallet._consecutive401 = 0;
            summary[wallet.wallet].done++;
            summary[wallet.wallet].earned += cfg.amountPerShot;
            console.log(
              chalk.green(
                `[INFO] ✅ +${cfg.amountPerShot} (${wallet.wallet}) shots=${summary[wallet.wallet].done}/${cfg.bursts *
                  currentConcurrency}, earned=${summary[wallet.wallet].earned}/${cap} bal=${r.balance}`
              )
            );
            windowStatuses.push(200);
          } else {
            const s = (r as any).status ?? 0;
            summary[wallet.wallet].lastError = (r as any).msg;
            if (s === 401) {
              console.log(chalk.red(`[WARN] 401 still failing → skip wallet ${wallet.wallet}`));
              summary[wallet.wallet].skipped = true;
            } else if (s === 429) {
              console.log(chalk.yellow(`[WARN] ⚠️ 429 rate limit`));
            } else {
              console.log(chalk.red(`[WARN] ❌ ${s} ${(r as any).msg}`));
            }
            windowStatuses.push(s);
          }
        })
      );

      await Promise.all(tasks);
      if (summary[wallet.wallet].skipped) break;

      // adaptive pause
      if (cfg.adaptiveMode) {
        const wsize = cfg.adaptive?.windowSize ?? 24;
        const recent = windowStatuses.slice(-wsize);
        const r429 = recent.filter((s) => s === 429).length / (recent.length || 1);

        // cooldown when heavy 429
        if (r429 > (cfg.adaptive?.high429Ratio ?? 0.25)) {
          const cd = cfg.adaptive?.cooldownMs ?? 2500;
          console.log(chalk.yellow(`[ADAPT] 429=${(r429 * 100).toFixed(0)}% → cooldown ${cd}ms`));
          await sleep(cd);
          pause = Math.min(pause + (cfg.adaptive?.step ?? 25), cfg.adaptive?.maxPause ?? 450);

          // ▼ Dynamic concurrency throttle (reduce by 1, min 1)
          const old = currentConcurrency;
          currentConcurrency = Math.max(1, currentConcurrency - 1);
          if (currentConcurrency !== old) {
            console.log(chalk.yellow(`[ADAPT] Reduce concurrency ${old} → ${currentConcurrency}`));
          }
        } else {
          pause = Math.max(pause - (cfg.adaptive?.step ?? 25), cfg.adaptive?.minPause ?? 120);

          // ▲ Lightly increase concurrency back up (max cfg.concurrency)
          if (currentConcurrency < cfg.concurrency && r429 === 0) {
            const old = currentConcurrency;
            currentConcurrency = Math.min(cfg.concurrency, currentConcurrency + 1);
            if (currentConcurrency !== old) {
              console.log(chalk.green(`[ADAPT] Increase concurrency ${old} → ${currentConcurrency}`));
            }
          }
        }
      }

      console.log(chalk.gray(`[${wallet.wallet}] Burst ${burst}/${cfg.bursts} → pause ${pause}ms (conc=${currentConcurrency})`));
      await sleep(pause);
      if (cfg.gapMsBetweenBursts) await sleep(cfg.gapMsBetweenBursts);
      if (summary[wallet.wallet].earned >= cap) break;
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

  await updateLogSummary(logFile);
  console.log(chalk.cyan(`[INFO] 🌾 Run done → successShots=${totalShots}, failedShots=${totalFail}, totalEarned=${totalEarned}`));
  console.log(chalk.cyan(`[INFO] ==============================================`));
}

main().catch((e) => console.error(chalk.red(`[FATAL] ${e.message}`)));
