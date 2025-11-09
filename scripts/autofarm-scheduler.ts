// scripts/autofarm-scheduler.ts
/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { setTimeout as sleep } from "node:timers/promises";
import chalk from "chalk";
import { AutoFarmConfig, WalletConfig, WalletRun, RunSummary } from "./types";
import { writeSummary } from "./autofarm-logger";

/** ─────────────────────────────────────────────────────────────────────────
 *  Helpers
 *  ───────────────────────────────────────────────────────────────────────── */
const NOW = () => new Date();
const ts = () => `[${NOW().toTimeString().slice(0, 8)}]`;
const DRY_RUN = process.env.DRY_RUN === "1";

/** อ่าน config */
function loadConfig(): AutoFarmConfig {
  const file = process.env.AUTOFARM_CONFIG || path.resolve(process.cwd(), "scripts", "config", "autofarm.config.json");
  const raw = fs.readFileSync(file, "utf8");
  const cfg = JSON.parse(raw) as AutoFarmConfig;

  // Override wallets ผ่าน ENV: WALLETS="w1,w2,w3"
  const envWallets = (process.env.WALLETS || "").trim();
  if (envWallets) {
    cfg.wallets = envWallets.split(",").map((w) => ({ wallet: w.trim() })).filter(Boolean);
  }

  // Defaults rate
  cfg.rate ??= { rps: 3, bucketSize: 6, refillEveryMs: 350, jitterMs: [50, 150] };
  return cfg;
}

/** token bucket limiter แบบง่าย */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillEveryMs: number;
  private readonly addPerRefill: number;

  constructor(capacity: number, refillEveryMs: number, rps: number) {
    this.capacity = capacity;
    this.refillEveryMs = refillEveryMs;
    this.addPerRefill = Math.max(1, Math.floor((rps * refillEveryMs) / 1000));
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async take(): Promise<void> {
    while (true) {
      this.refill();
      if (this.tokens > 0) {
        this.tokens--;
        return;
      }
      await sleep(50);
    }
  }

  private refill() {
    const now = Date.now();
    const intervals = Math.floor((now - this.lastRefill) / this.refillEveryMs);
    if (intervals > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + intervals * this.addPerRefill);
      this.lastRefill = this.lastRefill + intervals * this.refillEveryMs;
    }
  }
}

/** random jitter ms */
function jitter([min, max]: [number, number] = [0, 0]) {
  if (!min && !max) return 0;
  return Math.floor(min + Math.random() * (max - min));
}

/** Simple concurrency pool */
function pool<T, R>(items: T[], limit: number, worker: (item: T, idx: number) => Promise<R>): Promise<R[]> {
  const ret: Promise<R>[] = [];
  let i = 0;

  const run = async () => {
    while (i < items.length) {
      const idx = i++;
      ret[idx] = worker(items[idx], idx);
      if (ret.length - (await Promise.allSettled(ret)).filter((r) => r.status === "rejected").length >= limit) {
        // Wait a tick to allow some to complete if over limit
        await sleep(0);
      }
    }
  };
  // Launch up to limit runners
  return Promise.all(Array.from({ length: Math.min(limit, items.length) }, run)).then(() => Promise.all(ret));
}

/** ─────────────────────────────────────────────────────────────────────────
 *  API calls
 *  ───────────────────────────────────────────────────────────────────────── */
async function login(baseUrl: string, wallet: string): Promise<string> {
  const url = `${baseUrl}/api/auth/demo-login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet }),
  });
  if (!res.ok) {
    throw new Error(`login failed ${res.status}`);
  }
  const json = (await res.json()) as { token?: string };
  if (!json.token) throw new Error("login: no token");
  return json.token;
}

interface EarnResponse {
  ok?: boolean;
  balance?: number;
}

async function earnShot(baseUrl: string, token: string, type: string, amount: number): Promise<EarnResponse> {
  if (DRY_RUN) return { ok: true, balance: undefined };

  const url = `${baseUrl}/api/points/earn`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type, amount, meta: { session: "autofarm" } }),
  });

  if (res.status === 401) {
    const text = await res.text().catch(() => "");
    const err = new Error(`401 Unauthorized ${text}`);
    (err as any).status = 401;
    throw err;
  }
  if (res.status === 429) {
    const err = new Error("429 Too Many Requests");
    (err as any).status = 429;
    throw err;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`earn failed ${res.status} ${text}`);
  }
  const json = (await res.json()) as EarnResponse;
  return json;
}

/** ─────────────────────────────────────────────────────────────────────────
 *  Main
 *  ───────────────────────────────────────────────────────────────────────── */
async function main() {
  const cfg = loadConfig();

  console.log(`${ts()} ${chalk.cyan("Loaded config file")}: ${process.env.AUTOFARM_CONFIG || "scripts/config/autofarm.config.json"}`);
  console.log(`${ts()} ${chalk.cyan("==============================================")}`);
  const session = `dash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  console.log(`${ts()} ${chalk.green("🚀 AutoFarm run started")} (session: ${session})`);
  console.log(
    `${ts()} baseUrl=${cfg.baseUrl} | type=${cfg.type} | amount=${cfg.amount} | bursts=${cfg.bursts} | conc=${cfg.concurrency} | cap=${cfg.dailyCap}`
  );

  const rate = cfg.rate ?? { rps: 3, bucketSize: 6, refillEveryMs: 350, jitterMs: [50, 150] };
  const bucket = new TokenBucket(rate.bucketSize ?? 6, rate.refillEveryMs ?? 350, rate.rps ?? 3);

  if (DRY_RUN) console.log(chalk.yellow("[INFO] DRY-RUN: No API calls"));
  if (cfg.adaptiveMode) console.log(chalk.yellow("[INFO] Adaptive mode enabled"));

  // เตรียม token ต่อ wallet
  const walletTokens = new Map<string, string>();
  const walletRuns = new Map<string, WalletRun>();

  const wallets: WalletConfig[] = cfg.wallets ?? [];
  // เตรียม login พร้อมกัน (จำกัดด้วย pool เล็ก ๆ)
  await pool(wallets, Math.min(4, Math.max(1, cfg.concurrency)), async (w) => {
    try {
      const tok = w.token && w.token !== "STATIC_JWT_TOKEN_IF_YOU_HAVE" ? w.token : await login(cfg.baseUrl, w.wallet);
      walletTokens.set(w.wallet, tok);
      console.log(`${ts()} ${chalk.cyan("🔐 token ready for " + w.wallet.slice(0, 10) + "...")}`);
    } catch (e: any) {
      console.log(`${ts()} ${chalk.red("🔐 token failed for " + w.wallet)} ${e?.message || e}`);
      walletRuns.set(w.wallet, {
        wallet: w.wallet,
        token: undefined,
        earned: 0,
        shotsDone: 0,
        shotsTried: 0,
        lastError: "Login failed",
      });
    }
  });

  // ฟังก์ชันยิงต่อกระเป๋า
  async function runWallet(w: WalletConfig) {
    const run: WalletRun = walletRuns.get(w.wallet) ?? {
      wallet: w.wallet,
      token: walletTokens.get(w.wallet),
      earned: 0,
      shotsDone: 0,
      shotsTried: 0,
    };

    // ข้ามถ้าไม่มี token
    if (!run.token) {
      run.lastError = run.lastError ?? "No token";
      walletRuns.set(w.wallet, run);
      return;
    }

    for (let i = 0; i < cfg.bursts; i++) {
      if (run.earned >= cfg.dailyCap) {
        console.log(`${ts()} ${chalk.green("🏁 CAP reached for " + w.wallet)} → ${run.earned}/${cfg.dailyCap}`);
        break;
      }
      await bucket.take();
      const wait = jitter(rate.jitterMs);
      if (wait) await sleep(wait);

      run.shotsTried++;

      let attempt = 0;
      const maxRetry = 6;
      let lastErr: any;

      while (attempt <= maxRetry) {
        try {
          const res = await earnShot(cfg.baseUrl, run.token!, cfg.type, cfg.amount);
          run.shotsDone++;
          run.earned += cfg.amount;
          if (typeof res.balance === "number") run.lastBalance = res.balance;
          console.log(
            `${ts()} ${chalk.green("✅ +"+cfg.amount)} (${w.wallet}) shots=${run.shotsDone}/${cfg.bursts}, earned=${run.earned}/${cfg.dailyCap}` +
              (run.lastBalance != null ? ` balance=${run.lastBalance}` : "")
          );
          break; // success ของรอบนี้
        } catch (e: any) {
          lastErr = e;
          const status = e?.status ?? 0;

          if (status === 401) {
            // re-login 1 ครั้ง
            try {
              const newTok = await login(cfg.baseUrl, w.wallet);
              run.token = newTok;
              walletTokens.set(w.wallet, newTok);
              console.log(`${ts()} ${chalk.yellow("🔁 re-login success for " + w.wallet)}`);
              continue; // ยิงใหม่ทันที (นับเป็น retry)
            } catch (e2: any) {
              run.lastError = "Unauthorized";
              console.log(`${ts()} ${chalk.red("❌ (" + w.wallet + ") 401 Unauthorized")}`);
              break; // เลิกพยายามช็อตนี้
            }
          }

          if (status === 429) {
            // exponential backoff: 0.5s → 1s → 2s → 4s → 8s → 15s (cap)
            const backoffs = [500, 1000, 2000, 4000, 8000, 15000];
            const delay = backoffs[Math.min(attempt, backoffs.length - 1)];
            console.log(`${ts()} ${chalk.yellow(`[WARN] ⏳ Backoff (${attempt + 1}/${maxRetry}) for status 429 → ${delay}ms`)}`);
            await sleep(delay);
            attempt++;
            // adaptive: ลด rps เล็กน้อยระหว่างรัน
            if (cfg.adaptiveMode && attempt >= 3) {
              // เติม token ช้าลงเล็กน้อย
              await sleep(200);
            }
            continue;
          }

          // อื่น ๆ: ล้มรอบนี้
          run.lastError = e?.message || "unknown";
          console.log(`${ts()} ${chalk.yellow("❌ (" + w.wallet + ") error=" + run.lastError)}`);
          break;
        }
      }
    }

    walletRuns.set(w.wallet, run);
  }

  // รันทั้งหมดแบบ concurrency จำกัด
  await pool(wallets, Math.max(1, cfg.concurrency), runWallet);

  // รวมผล
  let successShots = 0;
  let failedShots = 0;
  let totalEarned = 0;

  for (const w of wallets) {
    const r = walletRuns.get(w.wallet) ?? {
      wallet: w.wallet,
      earned: 0,
      shotsDone: 0,
      shotsTried: 0,
    };
    successShots += r.shotsDone;
    failedShots += Math.max(0, r.shotsTried - r.shotsDone);
    totalEarned += r.earned;
  }

  const summary: RunSummary = {
    date: NOW().toISOString(),
    farmType: cfg.type,
    amountPerShot: cfg.amount,
    bursts: cfg.bursts,
    concurrency: cfg.concurrency,
    dailyCap: cfg.dailyCap,
    baseUrl: cfg.baseUrl,
    totals: {
      wallets: wallets.length,
      successShots,
      failedShots,
      totalEarned,
    },
    perWallet: Object.fromEntries(
      Array.from(walletRuns.entries()).map(([k, v]) => [k, v])
    ),
  };

  const { jsonPath } = writeSummary(summary);
  console.log(chalk.gray(`📄 Saved summary → ${jsonPath}`));
  console.log(
    `${ts()} ${chalk.green("🌾 Run done")} → successShots=${successShots}, failedShots=${failedShots}, totalEarned=${totalEarned}`
  );
  console.log(`${ts()} ${chalk.cyan("==============================================")}`);
}

main().catch((e) => {
  console.error(chalk.red(`[FATAL] ${e?.stack || e?.message || e}`));
  process.exit(1);
});
