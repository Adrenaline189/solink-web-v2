#!/usr/bin/env tsx
/**
 * AutoFarm Scheduler — Adaptive Version
 * Author: Luminex x GPT-5
 */

import fs from "fs";
import path from "path";
import axios from "axios";
import pLimit from "p-limit";
import chalk from "chalk";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const now = () => new Date().toISOString();

interface WalletConfig {
  wallet: string;
  token?: string;
}

interface Config {
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
  adaptive?: {
    windowSize: number;
    high429Ratio: number;
    cooldownMs: number;
    minPause: number;
    maxPause: number;
    step: number;
  };
}

const CONFIG_PATH =
  process.argv.includes("--config") ?
    process.argv[process.argv.indexOf("--config") + 1] :
    path.join(process.cwd(), "scripts/config/autofarm.config.json");

const DRY_RUN = process.argv.includes("--dry");
const ENABLE_ADAPTIVE = process.argv.includes("--adaptive");
const GAP_OVERRIDE = process.argv.includes("--gap")
  ? parseInt(process.argv[process.argv.indexOf("--gap") + 1])
  : null;

async function main() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf8");
  const cfg: Config = JSON.parse(raw);

  if (GAP_OVERRIDE) cfg.gapMsBetweenBursts = GAP_OVERRIDE;
  if (ENABLE_ADAPTIVE) cfg.adaptiveMode = true;

  console.log(chalk.cyan(`[${now()}] [INFO] Loaded config file: ${CONFIG_PATH}`));
  console.log(chalk.cyan("[INFO] =============================================="));
  const session = `${cfg.metaPrefix || "dash"}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  console.log(chalk.cyan(`[INFO] 🚀 AutoFarm run started (session: ${session})`));
  console.log(
    chalk.cyan(
      `[INFO] baseUrl=${cfg.baseUrl} | type=${cfg.farmType} | amount=${cfg.amountPerShot} | bursts=${cfg.bursts} | conc=${cfg.concurrency} | cap=${cfg.dailyCap}`
    )
  );

  const perWalletSummary: Record<string, any> = {};
  for (const wallet of cfg.wallets) {
    perWalletSummary[wallet.wallet] = {
      wallet: wallet.wallet,
      token: wallet.token || "",
      earned: 0,
      shotsDone: 0,
      shotsTried: 0,
      lastBalance: 0,
      lastError: null,
    };
  }

  for (const wallet of cfg.wallets) {
    let currentPause = cfg.pauseMsBetweenShots;
    const results: string[] = [];
    const limit = pLimit(cfg.concurrency);

    for (let i = 0; i < cfg.bursts; i++) {
      const shotIndex = i + 1;
      const tasks = Array.from({ length: cfg.concurrency }, (_, idx) =>
        limit(async () => {
          const attemptId = `${wallet.wallet}-shot-${shotIndex}-${idx}`;
          try {
            perWalletSummary[wallet.wallet].shotsTried++;
            if (DRY_RUN) {
              await sleep(50);
              results.push(`✅ +${cfg.amountPerShot} (dry)`);
              perWalletSummary[wallet.wallet].shotsDone++;
              perWalletSummary[wallet.wallet].earned += cfg.amountPerShot;
              return;
            }

            const url = `${cfg.baseUrl}/api/points/earn`;
            const res = await axios.post(
              url,
              {
                type: cfg.farmType,
                amount: cfg.amountPerShot,
                meta: { session, attemptId },
              },
              {
                headers: { Authorization: `Bearer ${wallet.token}` },
              }
            );
            const bal = res.data?.event?.balance || 0;
            results.push(`✅ +${cfg.amountPerShot} (${wallet.wallet}) balance=${bal}`);
            perWalletSummary[wallet.wallet].shotsDone++;
            perWalletSummary[wallet.wallet].earned += cfg.amountPerShot;
            perWalletSummary[wallet.wallet].lastBalance = bal;
          } catch (err: any) {
            const status = err.response?.status || 0;
            const message =
              err.response?.data?.error ||
              err.message ||
              "Unknown error";
            perWalletSummary[wallet.wallet].lastError = message;
            if (status === 429) {
              results.push(`⚠️  429 (rate limit)`);
              if (cfg.adaptiveMode) {
                currentPause = Math.min(
                  currentPause + (cfg.adaptive?.step || 50),
                  cfg.adaptive?.maxPause || 400
                );
              }
              await sleep(cfg.backoffBaseMs + Math.random() * cfg.backoffJitterMs);
            } else if (status === 401) {
              results.push(`❌ 401 Unauthorized`);
              throw new Error("Unauthorized");
            } else {
              results.push(`❌ ${status} ${message}`);
            }
          }
        })
      );

      await Promise.all(tasks);
      if (cfg.adaptiveMode && Math.random() < 0.2) {
        currentPause = Math.max(
          currentPause - (cfg.adaptive?.step || 20),
          cfg.adaptive?.minPause || 120
        );
      }

      console.log(
        chalk.gray(
          `[${wallet.wallet}] Burst ${shotIndex}/${cfg.bursts} done | pause=${currentPause}ms`
        )
      );
      await sleep(currentPause);
    }

    if (cfg.gapMsBetweenBursts) {
      console.log(
        chalk.yellow(
          `🕓 Waiting ${cfg.gapMsBetweenBursts}ms before next wallet/burst...`
        )
      );
      await sleep(cfg.gapMsBetweenBursts);
    }
  }

  const summary = {
    date: new Date().toISOString(),
    farmType: cfg.farmType,
    amountPerShot: cfg.amountPerShot,
    bursts: cfg.bursts,
    concurrency: cfg.concurrency,
    dailyCap: cfg.dailyCap,
    baseUrl: cfg.baseUrl,
    totals: {
      wallets: cfg.wallets.length,
      successShots: Object.values(perWalletSummary).reduce(
        (a, w: any) => a + w.shotsDone,
        0
      ),
      failedShots: Object.values(perWalletSummary).reduce(
        (a, w: any) => a + (w.shotsTried - w.shotsDone),
        0
      ),
      totalEarned: Object.values(perWalletSummary).reduce(
        (a, w: any) => a + w.earned,
        0
      ),
    },
    perWallet: perWalletSummary,
  };

  const logDir = path.join(process.cwd(), "scripts/logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `${new Date().toISOString().split("T")[0]}.json`);
  fs.writeFileSync(logFile, JSON.stringify(summary, null, 2));
  console.log(chalk.green(`📄 Saved summary → ${logFile}`));
  console.log(chalk.cyan(`[INFO] 🌾 Run done → successShots=${summary.totals.successShots}, failedShots=${summary.totals.failedShots}, totalEarned=${summary.totals.totalEarned}`));
  console.log(chalk.cyan("[INFO] =============================================="));
}

main().catch((e) => {
  console.error(chalk.red(`[ERROR] ${e.message}`));
  process.exit(1);
});
