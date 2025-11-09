// /scripts/autofarm-scheduler.ts
/* eslint-disable no-console */
import path from "path";
import fs from "fs";
import { log, writeDailySummary } from "./utils/logger";

/**
 * =======================
 * AutoFarm Scheduler (Full)
 * =======================
 * Node >= 18 (native fetch)
 *
 * How to run:
 *   ts-node scripts/autofarm-scheduler.ts
 *   # or build to JS and: node dist/scripts/autofarm-scheduler.js
 *
 * Optional config file (JSON):
 *   scripts/config/autofarm.config.json
 *
 * You can override by ENV (see ENV OVERRIDES below).
 */

type FarmType = "extension_farm" | "turbo_farm";

interface WalletEntry {
  wallet: string;
  /** If provided, will use this static token; otherwise will try demo-login by wallet. */
  token?: string;
}

interface AutoFarmConfig {
  baseUrl: string;                 // e.g. https://api-solink.network
  farmType: FarmType;              // "extension_farm" | "turbo_farm"
  amountPerShot: number;           // e.g. 50
  bursts: number;                  // #shots to attempt per wallet per cycle
  concurrency: number;             // parallel requests across wallets
  dailyCap: number;                // stop per wallet when reached in the day (relative to run)
  wallets: WalletEntry[];          // target wallets
  metaPrefix?: string;             // prefix text for meta.session
  pauseMsBetweenShots?: number;    // small gap between shots in same worker (default 100~300)
  maxRetries?: number;             // retry for 429/5xx (default 6)
  backoffBaseMs?: number;          // base backoff (default 500)
  backoffJitterMs?: number;        // jitter added to backoff (default 250)
  timezone?: string;               // for logs only, default "Asia/Bangkok"
  /** If true, stop whole run when all wallets either capped or finished bursts */
  stopWhenAllDone?: boolean;       // default true
}

interface RunStatePerWallet {
  wallet: string;
  token?: string;
  earned: number;        // earned in this run
  shotsDone: number;     // successful shots in this run
  shotsTried: number;    // including failures
  lastBalance?: number;  // as returned by API
  lastError?: string;
}

interface RunSummary {
  date: string;
  farmType: FarmType;
  amountPerShot: number;
  bursts: number;
  concurrency: number;
  dailyCap: number;
  baseUrl: string;
  totals: {
    wallets: number;
    successShots: number;
    failedShots: number;
    totalEarned: number;
  };
  perWallet: Record<string, RunStatePerWallet>;
}

/* =========================
 * Load config (file + ENV)
 * ========================= */

function loadConfig(): AutoFarmConfig {
  const defaultConfigPath = path.join(__dirname, "config", "autofarm.config.json");
  let fileCfg: Partial<AutoFarmConfig> = {};
  if (fs.existsSync(defaultConfigPath)) {
    try {
      fileCfg = JSON.parse(fs.readFileSync(defaultConfigPath, "utf-8"));
      log(`Loaded config file: ${defaultConfigPath}`);
    } catch (e: any) {
      log(`Failed to parse config file: ${e?.message}`, "WARN");
    }
  }

  // ENV OVERRIDES (all optional)
  const env = process.env;
  const envWallets = env.AUTOFARM_WALLETS
    ? env.AUTOFARM_WALLETS.split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .map(w => ({ wallet: w }))
    : undefined;

  const cfg: AutoFarmConfig = {
    baseUrl: env.AUTOFARM_BASE_URL || fileCfg.baseUrl || "https://api-solink.network",
    farmType: ((env.AUTOFARM_TYPE as FarmType) || fileCfg.farmType || "extension_farm") as FarmType,
    amountPerShot: Number(env.AUTOFARM_AMOUNT || fileCfg.amountPerShot || 50),
    bursts: Number(env.AUTOFARM_BURSTS || fileCfg.bursts || 40),
    concurrency: Number(env.AUTOFARM_CONCURRENCY || fileCfg.concurrency || 5),
    dailyCap: Number(env.AUTOFARM_DAILY_CAP || fileCfg.dailyCap || 2000),
    wallets: envWallets || fileCfg.wallets || [{ wallet: "demo_wallet_test1" }],
    metaPrefix: env.AUTOFARM_META_PREFIX || fileCfg.metaPrefix || "dash",
    pauseMsBetweenShots: toNum(env.AUTOFARM_PAUSE_MS, fileCfg.pauseMsBetweenShots, 120),
    maxRetries: toNum(env.AUTOFARM_MAX_RETRIES, fileCfg.maxRetries, 6),
    backoffBaseMs: toNum(env.AUTOFARM_BACKOFF_BASE_MS, fileCfg.backoffBaseMs, 500),
    backoffJitterMs: toNum(env.AUTOFARM_BACKOFF_JITTER_MS, fileCfg.backoffJitterMs, 250),
    timezone: env.TZ || fileCfg.timezone || "Asia/Bangkok",
    stopWhenAllDone: toBool(env.AUTOFARM_STOP_ALL_DONE, fileCfg.stopWhenAllDone, true),
  };

  return cfg;
}

function toNum(envVal?: string, fileVal?: number, def = 0): number {
  if (envVal != null && envVal !== "") return Number(envVal);
  if (typeof fileVal === "number") return fileVal;
  return def;
}
function toBool(envVal?: string, fileVal?: boolean, def = false): boolean {
  if (envVal != null && envVal !== "") return envVal === "true" || envVal === "1";
  if (typeof fileVal === "boolean") return fileVal;
  return def;
}

/* =========================
 * Helpers
 * ========================= */

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
const jitter = (n: number) => Math.floor(Math.random() * n);
const nowSession = (prefix: string) => `${prefix}-${Date.now()}-${randBase36(4)}`;
function randBase36(len = 5) {
  return Math.random().toString(36).slice(2, 2 + len);
}

/** Get token either from entry.token or demo-login */
async function ensureToken(baseUrl: string, wallet: string, existing?: string): Promise<string> {
  if (existing) return existing;
  const url = `${baseUrl}/api/auth/demo-login`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet }),
  });
  if (!resp.ok) {
    throw new Error(`demo-login failed ${resp.status}`);
  }
  const json: any = await resp.json();
  if (!json?.token) throw new Error("demo-login: token missing in response");
  return json.token;
}

/** POST /api/points/earn */
async function earnOnce(params: {
  baseUrl: string;
  token: string;
  type: FarmType;
  amount: number;
  session: string;
}) {
  const url = `${params.baseUrl}/api/points/earn`;
  const body = {
    type: params.type,
    amount: params.amount,
    meta: { session: params.session },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const status = resp.status;
  let json: any = null;
  try {
    json = await resp.json();
  } catch {
    // ignore parse failure
  }
  return { status, json };
}

/** Retry policy for 429/5xx */
async function earnWithRetry(
  p: Parameters<typeof earnOnce>[0],
  maxRetries: number,
  base: number,
  jitterMs: number
) {
  let attempt = 0;
  // @ts-ignore
  while (true) {
    const { status, json } = await earnOnce(p);
    if (status < 400) return { status, json };

    const retriable = status === 429 || (status >= 500 && status < 600);
    if (!retriable || attempt >= maxRetries) {
      return { status, json };
    }
    attempt++;
    const backoff = Math.min(15000, base * Math.pow(2, attempt - 1)) + jitter(jitterMs);
    log(`⏳ Backoff (${attempt}/${maxRetries}) for status ${status} → ${backoff}ms`, "WARN");
    await sleep(backoff);
  }
}

/* =========================
 * Simple semaphore for concurrency
 * ========================= */
class Semaphore {
  private queue: Array<() => void> = [];
  private permits: number;
  constructor(n: number) {
    this.permits = n;
  }
  async acquire() {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    await new Promise<void>(res => this.queue.push(res));
  }
  release() {
    this.permits++;
    const fn = this.queue.shift();
    if (fn) {
      this.permits--;
      fn();
    }
  }
}

/* =========================
 * Main run
 * ========================= */

async function runOnce(cfg: AutoFarmConfig) {
  const sessionPrefix = cfg.metaPrefix || "dash";
  const runSession = nowSession(sessionPrefix);

  log("==============================================");
  log(`🚀 AutoFarm run started (session: ${runSession})`);
  log(
    `baseUrl=${cfg.baseUrl} | type=${cfg.farmType} | amount=${cfg.amountPerShot} | bursts=${cfg.bursts} | conc=${cfg.concurrency} | cap=${cfg.dailyCap}`
  );

  const sem = new Semaphore(cfg.concurrency);
  const perWallet: Record<string, RunStatePerWallet> = {};
  let globalSuccess = 0;
  let globalFail = 0;

  // prepare tokens
  for (const w of cfg.wallets) {
    perWallet[w.wallet] = {
      wallet: w.wallet,
      token: w.token,
      earned: 0,
      shotsDone: 0,
      shotsTried: 0,
    };
  }

  // For each wallet, enqueue "bursts" shots (but each shot worker will early-stop if cap reached)
  const tasks: Promise<void>[] = [];

  for (const w of cfg.wallets) {
    for (let i = 0; i < cfg.bursts; i++) {
      tasks.push(
        (async () => {
          await sem.acquire();
          try {
            const state = perWallet[w.wallet];

            // Early stop if this wallet already hit cap
            if (state.earned >= cfg.dailyCap) return;

            // Ensure token
            if (!state.token) {
              try {
                state.token = await ensureToken(cfg.baseUrl, w.wallet);
                log(`🔐 token ready for ${w.wallet.substring(0, 10)}...`);
              } catch (e: any) {
                state.lastError = `token error: ${e?.message || e}`;
                globalFail++;
                return;
              }
            }

            state.shotsTried++;
            const session = `${runSession}-${w.wallet.slice(0, 6)}-${state.shotsTried}`;

            const { status, json } = await earnWithRetry(
              {
                baseUrl: cfg.baseUrl,
                token: state.token!,
                type: cfg.farmType,
                amount: cfg.amountPerShot,
                session,
              },
              cfg.maxRetries ?? 6,
              cfg.backoffBaseMs ?? 500,
              cfg.backoffJitterMs ?? 250
            );

            if (status < 400 && json?.ok) {
              state.shotsDone++;
              state.earned += cfg.amountPerShot;
              state.lastBalance = json?.balance;
              globalSuccess++;
              log(
                `✅ +${cfg.amountPerShot} (${w.wallet}) shots=${state.shotsDone}/${cfg.bursts}, earned=${state.earned}/${cfg.dailyCap} balance=${json?.balance}`
              );
            } else {
              globalFail++;
              const errMsg =
                json?.error ||
                json?.message ||
                (status >= 400 ? `HTTP ${status}` : "unknown error");
              state.lastError = errMsg;
              log(`❌ (${w.wallet}) status=${status} error="${errMsg}"`, "WARN");
            }

            // Cap check
            if (state.earned >= cfg.dailyCap) {
              log(`🏁 CAP reached for ${w.wallet} → ${state.earned}/${cfg.dailyCap}`);
            }

            // small pause to be gentle
            const pause = cfg.pauseMsBetweenShots ?? 120;
            if (pause > 0) await sleep(pause + jitter(40));
          } finally {
            sem.release();
          }
        })()
      );
    }
  }

  // Wait all
  await Promise.all(tasks);

  // Summaries
  const summary: RunSummary = {
    date: new Date().toISOString(),
    farmType: cfg.farmType,
    amountPerShot: cfg.amountPerShot,
    bursts: cfg.bursts,
    concurrency: cfg.concurrency,
    dailyCap: cfg.dailyCap,
    baseUrl: cfg.baseUrl,
    totals: {
      wallets: cfg.wallets.length,
      successShots: globalSuccess,
      failedShots: globalFail,
      totalEarned: Object.values(perWallet).reduce((s, w) => s + w.earned, 0),
    },
    perWallet,
  };

  writeDailySummary(summary);
  log(
    `🌾 Run done → successShots=${summary.totals.successShots}, failedShots=${summary.totals.failedShots}, totalEarned=${summary.totals.totalEarned}`
  );
  log("==============================================");
  return summary;
}

/**
 * Scheduler:
 * - โหมด default: รันครั้งเดียว (เหมาะกับการผูก cron/pm2)
 * - ถ้าอยาก loop ภายในโปรเซส: ตั้ง ENV AUTOFARM_INTERVAL_SEC (เช่น 1800 = 30 นาที)
 */
async function main() {
  const cfg = loadConfig();

  const loopSec = Number(process.env.AUTOFARM_INTERVAL_SEC || 0);
  if (!loopSec) {
    await runOnce(cfg);
    return;
  }

  log(`⏱️  Interval mode enabled: every ${loopSec}s`);
  let stopping = false;

  const stopSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  stopSignals.forEach(sig =>
    process.on(sig, () => {
      if (!stopping) {
        stopping = true;
        log(`Received ${sig}, will stop after current cycle...`, "WARN");
      }
    })
  );

  while (!stopping) {
    const summary = await runOnce(cfg);

    // ถ้าทุก wallet หมดเหตุจะยิง (ได้ cap หรือครบ bursts) และตั้งค่าให้หยุด → จบ
    if (cfg.stopWhenAllDone !== false) {
      const allDone = Object.values(summary.perWallet).every(
        w => w.earned >= cfg.dailyCap || w.shotsDone >= cfg.bursts
      );
      if (allDone) {
        log("🛑 All wallets done (cap or bursts reached) → stopping interval loop.");
        break;
      }
    }

    // sleep to next interval
    const waitMs = Math.max(1, loopSec * 1000);
    await sleep(waitMs);
  }
}

main().catch(err => {
  log(`FATAL: ${err?.stack || err}`, "ERROR");
  process.exit(1);
});
