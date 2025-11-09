/**
 * AutoFarm Scheduler
 * - Automatically simulates "farm" transactions for testing or development
 * - Reads config from scripts/config/autofarm.config.json
 * - Supports bursts, concurrency, backoff, retry, and daily cap
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import pLimit from "p-limit";
import fetch from "node-fetch";

const CONFIG_PATH = path.join(process.cwd(), "scripts/config/autofarm.config.json");
const LOG_DIR = path.join(process.cwd(), "scripts/logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

interface WalletConfig {
  wallet: string;
  token?: string;
}

interface AutoFarmConfig {
  baseUrl: string;
  farmType: string;
  amountPerShot: number;
  bursts: number;
  concurrency: number;
  dailyCap: number;
  wallets: WalletConfig[];
  metaPrefix: string;
  pauseMsBetweenShots: number;
  maxRetries: number;
  backoffBaseMs: number;
  backoffJitterMs: number;
  stopWhenAllDone?: boolean;
  adaptiveMode?: boolean;
  rate?: { rps: number; bucketSize: number; refillEveryMs: number };
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function backoffDelay(base: number, attempt: number, jitter: number) {
  const exp = base * Math.pow(2, attempt);
  const rand = Math.random() * jitter;
  return exp + rand;
}

async function fetchEarn(
  cfg: AutoFarmConfig,
  wallet: string,
  token: string | undefined,
  shot: number
) {
  const meta = { session: `${cfg.metaPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
  const body = {
    wallet,
    type: cfg.farmType,
    amount: cfg.amountPerShot,
    meta,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": "solink_secret_12345",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let lastErr: any;
  for (let i = 0; i < cfg.maxRetries; i++) {
    try {
      const res = await fetch(`${cfg.baseUrl}/api/points/earn`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        const delay = backoffDelay(cfg.backoffBaseMs, i, cfg.backoffJitterMs);
        console.log(chalk.yellow(`[WARN] ⏳ Backoff (${i + 1}/${cfg.maxRetries}) for status 429 → ${delay.toFixed(0)}ms`));
        await sleep(delay);
        continue;
      }

      const data = await res.json();
      if (data.ok) return { ok: true, body: data, status: res.status };
      lastErr = data;
    } catch (err) {
      lastErr = err;
    }
  }
  return { ok: false, error: lastErr };
}

async function main() {
  console.log(chalk.cyan("[INFO] =============================================="));

  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(chalk.red(`[ERROR] Config not found: ${CONFIG_PATH}`));
    process.exit(1);
  }

  const cfg: AutoFarmConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  console.log(chalk.cyan(`[INFO] Loaded config file: ${CONFIG_PATH}`));

  const DRY_RUN = process.env.DRY_RUN === "1";
  const session = `${cfg.metaPrefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  console.log(chalk.cyan(`[INFO] 🚀 AutoFarm run started (session: ${session})`));
  console.log(
    chalk.cyan(
      `[INFO] baseUrl=${cfg.baseUrl} | type=${cfg.farmType} | amount=${cfg.amountPerShot} | bursts=${cfg.bursts} | conc=${cfg.concurrency} | cap=${cfg.dailyCap}`
    )
  );

  if (DRY_RUN) console.log(chalk.yellow("[INFO] DRY-RUN: No API calls"));
  if (cfg.adaptiveMode) console.log(chalk.yellow("[INFO] Adaptive mode enabled"));

  const rate = cfg.rate ?? { rps: 3, bucketSize: 6, refillEveryMs: 250 };

  // Global rate limiter
  const limiter = pLimit(cfg.concurrency);
  const summary: Record<string, any> = {};
  let totalEarned = 0;

  for (const walletCfg of cfg.wallets) {
    const { wallet, token } = walletCfg;
    console.log(chalk.cyan(`[INFO] 🔐 token ready for ${wallet.slice(0, 10)}...`));
    summary[wallet] = { tried: 0, done: 0, earned: 0, balance: 0 };

    for (let i = 0; i < cfg.bursts; i++) {
      summary[wallet].tried++;
      if (DRY_RUN) continue;

      const result = await limiter(() => fetchEarn(cfg, wallet, token, i));

      if (result.ok) {
        const bal = result.body?.balance ?? 0;
        totalEarned += cfg.amountPerShot;
        summary[wallet].done++;
        summary[wallet].earned += cfg.amountPerShot;
        summary[wallet].balance = bal;
        console.log(
          chalk.green(
            `✅ +${cfg.amountPerShot} (${wallet}) shots=${summary[wallet].done}/${cfg.bursts}, earned=${summary[wallet].earned}/${cfg.dailyCap} balance=${bal}`
          )
        );
        if (summary[wallet].earned >= cfg.dailyCap && cfg.stopWhenAllDone) break;
      } else {
        console.log(
          chalk.yellow(
            `[WARN] ❌ (${wallet}) status=${result?.error?.status || "?"} error="${result?.error?.message || result?.error}"`
          )
        );
      }

      if (cfg.pauseMsBetweenShots > 0) await sleep(cfg.pauseMsBetweenShots);
    }
  }

  // Save result log
  const now = new Date();
  const filename = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}.json`;
  const outPath = path.join(LOG_DIR, filename);
  const logData = {
    date: now.toISOString(),
    totals: { earned: totalEarned },
    wallets: summary,
  };
  fs.writeFileSync(outPath, JSON.stringify(logData, null, 2));
  console.log(chalk.green(`📄 Saved summary → ${outPath}`));

  console.log(
    chalk.cyan(
      `[INFO] 🌾 Run done → successShots=${Object.values(summary).reduce((a, b: any) => a + b.done, 0)}, totalEarned=${totalEarned}`
    )
  );
  console.log(chalk.cyan("[INFO] =============================================="));
}

main().catch((e) => {
  console.error(chalk.red(`[FATAL] ${e}`));
  process.exit(1);
});
