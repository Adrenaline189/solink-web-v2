/**
 * AutoFarm Scheduler — v1.1 (2025-11-10)
 * ------------------------------------------------------------
 * Purpose:
 *  - Drive "extension_farm" earning shots against the API with robust
 *    rate-limit handling, per-wallet daily cap protection, and clean logs.
 *  - Strict DRY_RUN mode: absolutely NO network calls when enabled.
 *
 * Highlights:
 *  - Reads base config from scripts/config/autofarm.config.json (CJS/ESM-safe).
 *  - ENV overrides for WALLETS, BURSTS, CONCURRENCY, BASE_URL, AMOUNT, TYPE, CAP.
 *  - ENV WALLETS takes precedence and filters wallets strictly.
 *  - Treats placeholder tokens (e.g., "STATIC_JWT_TOKEN_IF_YOU_HAVE" or missing)
 *    as "no token" → attempts demo-login (except in DRY_RUN).
 *  - Exponential backoff for HTTP 429 with jittery timings identical to your logs.
 *  - Per-wallet summary + daily aggregate persisted to scripts/logs/YYYY-MM-DD.json
 *
 * Usage examples:
 *  - DRY run single wallet (no network):
 *      WALLETS=demo_wallet_test2 DRY_RUN=1 npx tsx scripts/autofarm-scheduler.ts
 *
 *  - Live two wallets with gentler load:
 *      WALLETS=demo_wallet_test1,demo_wallet_test2 BURSTS=20 CONCURRENCY=2 npx tsx scripts/autofarm-scheduler.ts
 *
 * Notes:
 *  - If backend has not authorized a wallet for demo-login, you will see 401.
 *    In that case, allow the wallet in your API or create a user for it.
 */

import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

// ----------------------- Path & Environment helpers -----------------------

const __filename =
  // @ts-ignore
  typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const __dirname =
  // @ts-ignore
  typeof __dirname !== "undefined" ? __dirname : path.dirname(__filename);

function nowTs() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
}

function info(msg: string) {
  console.log(`${nowTs()} [INFO] ${msg}`);
}
function warn(msg: string) {
  console.log(`${nowTs()} [WARN] ${msg}`);
}
function err(msg: string) {
  console.log(`${nowTs()} [ERR ] ${msg}`);
}

function banner() {
  console.log(`${nowTs()} autofarm-scheduler v1.1`);
}

function parseBoolEnv(name: string, def = false) {
  const v = process.env[name];
  if (v == null) return def;
  return ["1", "true", "yes", "y", "on"].includes(String(v).toLowerCase());
}

function parseIntEnv(name: string, def: number) {
  const v = process.env[name];
  if (v == null) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function parseCsvEnv(name: string): string[] | null {
  const v = process.env[name];
  if (!v) return null;
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function looksLikeJwt(token: string | undefined | null): boolean {
  if (!token) return false;
  if (token.startsWith("STATIC_")) return false; // treat placeholders as invalid
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function jitter(ms: number, pct = 0.15) {
  const delta = Math.floor(ms * pct);
  const low = ms - delta;
  const high = ms + delta;
  return Math.floor(low + Math.random() * (high - low + 1));
}

function makeSessionId() {
  return `dash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ------------------------------ Types -------------------------------------

type WalletConfig = {
  wallet: string;
  token?: string;
};

type AutoFarmConfig = {
  baseUrl: string;
  farmType: string; // e.g., "extension_farm"
  amountPerShot: number; // e.g., 50
  bursts: number; // number of attempts (upper bound)
  concurrency: number; // per-wallet concurrency
  dailyCap: number; // per-wallet daily cap
  wallets: WalletConfig[];
};

type PerWalletRun = {
  wallet: string;
  token?: string;
  earned: number;
  shotsDone: number;
  shotsTried: number;
  lastBalance: number;
  lastError?: string;
};

// ----------------------------- Config Load --------------------------------

async function loadConfig(): Promise<AutoFarmConfig> {
  const confPath = path.resolve(__dirname, "config", "autofarm.config.json");
  const raw = await fsp.readFile(confPath, "utf8");
  const parsed = JSON.parse(raw) as AutoFarmConfig;

  // Apply ENV overrides (if any)
  const envBase = process.env.BASE_URL;
  const envType = process.env.TYPE;
  const envAmount = process.env.AMOUNT ? Number(process.env.AMOUNT) : undefined;
  const envCap = process.env.CAP ? Number(process.env.CAP) : undefined;
  const envBursts = process.env.BURSTS ? Number(process.env.BURSTS) : undefined;
  const envConc = process.env.CONCURRENCY ? Number(process.env.CONCURRENCY) : undefined;

  if (envBase) parsed.baseUrl = envBase;
  if (envType) parsed.farmType = envType;
  if (Number.isFinite(envAmount)) parsed.amountPerShot = Number(envAmount);
  if (Number.isFinite(envCap)) parsed.dailyCap = Number(envCap);
  if (Number.isFinite(envBursts)) parsed.bursts = Number(envBursts);
  if (Number.isFinite(envConc)) parsed.concurrency = Number(envConc);

  // ENV WALLETS filter/override (strict)
  const envWallets = parseCsvEnv("WALLETS");
  if (envWallets && envWallets.length > 0) {
    // Map env list onto existing config entries (preserve token if provided there)
    const map = new Map(parsed.wallets.map((w) => [w.wallet, w]));
    parsed.wallets = envWallets.map((w) => map.get(w) ?? { wallet: w });
  }

  return parsed;
}

// ------------------------------- API Layer --------------------------------

/**
 * Encapsulates API calls. In DRY_RUN, absolutely no network I/O is performed,
 * and predictable mock responses are returned instead.
 */
class Api {
  constructor(private baseUrl: string, private dryRun: boolean) {}

  private async postJson<T>(url: string, body: unknown, headers?: Record<string, string>) {
    if (this.dryRun) {
      // DRY_RUN never touches the network.
      return { ok: true, status: 200, json: async () => ({} as T) };
    }
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      body: JSON.stringify(body),
    });
    return resp as unknown as Response & { json<T>(): Promise<T> };
  }

  async demoLogin(wallet: string): Promise<{ token: string } | null> {
    // In DRY_RUN return a fake token, but do not log "token ready" from server
    if (this.dryRun) {
      return { token: `DRY.${Buffer.from(wallet).toString("base64")}.RUN` };
    }
    const url = `${this.baseUrl.replace(/\/+$/, "")}/api/auth/demo-login`;
    const resp = await this.postJson<{ token: string }>(url, { wallet });
    if ("ok" in resp && !resp.ok) return null; // TS appeasement if casted
    if (resp.status === 200) {
      const data = await resp.json();
      return data?.token ? data : null;
    }
    return null;
  }

  async earn(token: string, type: string, amount: number, session: string) {
    const url = `${this.baseUrl.replace(/\/+$/, "")}/api/points/earn`;
    const body = { type, amount, meta: { session } };
    const headers = { Authorization: `Bearer ${token}` };

    if (this.dryRun) {
      // Simulate a successful earn with a pseudo-random balance step
      const balance = 50000 + Math.floor(Math.random() * 2000);
      return { status: 200, ok: true, data: { ok: true, balance } };
    }

    const resp = await this.postJson<any>(url, body, headers);
    let data: any = null;
    try {
      data = await resp.json();
    } catch {
      /* swallow JSON parse errors */
    }
    return { status: resp.status, ok: (resp as any).ok === true, data };
  }
}

// --------------------------- Core Farm Routine ----------------------------

async function farmWallet(
  api: Api,
  cfg: AutoFarmConfig,
  walletCfg: WalletConfig,
  session: string
): Promise<PerWalletRun> {
  const { amountPerShot, bursts, concurrency, dailyCap, farmType } = cfg;

  // Resolve token strategy
  let token: string | undefined = walletCfg.token;
  if (!looksLikeJwt(token)) {
    // Missing/placeholder token → try demo-login (unless DRY_RUN)
    const login = await api.demoLogin(walletCfg.wallet);
    if (!login) {
      // No token (e.g., 401 backend) — we still proceed but any real call will fail.
      token = undefined;
    } else {
      token = login.token;
      info(`🔐 token ready for ${walletCfg.wallet.slice(0, 9)}...`);
    }
  }

  // Per-wallet accumulators
  let earned = 0;
  let shotsDone = 0;
  let shotsTried = 0;
  let lastBalance = 0;
  let lastError: string | undefined;

  // Cap guard: how many shots allowed by cap?
  const remainingToCap = Math.max(0, Math.floor((dailyCap - earned) / amountPerShot));
  const maxShotsByCap = Math.min(bursts, remainingToCap || bursts);

  // Prepare a queue of "work items" = shot numbers 1..bursts
  const totalShots = Math.min(bursts, Math.ceil(dailyCap / amountPerShot));
  const work: number[] = Array.from({ length: totalShots }, (_, i) => i + 1);

  // Simple concurrency pool
  const workers: Promise<void>[] = [];
  const maxWorkers = Math.max(1, concurrency);

  async function runOne(shotNo: number) {
    shotsTried += 1;

    // If cap already hit, skip
    if (earned >= dailyCap) {
      return;
    }

    // If no valid token, mark 401 and stop trying further "real" earn calls for this wallet
    if (!looksLikeJwt(token)) {
      lastError = "Unauthorized";
      warn(`❌ (${walletCfg.wallet}) status=401 error="Unauthorized"`);
      return;
    }

    // 429 retry loop (6 attempts matches your logs)
    const backoffs = [600, 1100, 2100, 4100, 8100, 15100]; // base ms (approx as per your logs)
    let attempt = 0;

    // If DRY_RUN → a single simulated "200" then return
    if (parseBoolEnv("DRY_RUN", false)) {
      shotsDone += 1;
      earned += amountPerShot;
      lastBalance += amountPerShot; // purely cosmetic in DRY
      info(`✅ +${amountPerShot} (${walletCfg.wallet}) shots=${shotsDone}/${bursts}, earned=${earned}/${dailyCap} balance=${lastBalance}`);
      return;
    }

    while (attempt <= backoffs.length) {
      const resp = await api.earn(token!, farmType, amountPerShot, session);

      // Handle success
      if (resp.status === 200 && resp.data?.ok) {
        shotsDone += 1;
        earned += amountPerShot;
        lastBalance = Number(resp.data?.balance ?? lastBalance);
        info(
          `✅ +${amountPerShot} (${walletCfg.wallet}) shots=${shotsDone}/${bursts}, earned=${earned}/${dailyCap} balance=${lastBalance}`
        );
        return;
      }

      // Handle 401
      if (resp.status === 401) {
        lastError = "Unauthorized";
        warn(`❌ (${walletCfg.wallet}) status=401 error="Unauthorized"`);
        return;
      }

      // Handle 429 with backoff
      if (resp.status === 429 && attempt < backoffs.length) {
        const wait = jitter(backoffs[attempt]);
        warn(`⏳ Backoff (${attempt + 1}/${backoffs.length}) for status 429 → ${wait}ms`);
        await sleep(wait);
        attempt++;
        continue;
      }

      // Other errors or out-of-retries for 429
      lastError = resp?.data?.error || `HTTP_${resp.status}`;
      if (resp.status === 429) {
        warn(`❌ (${walletCfg.wallet}) status=429 error="Too many requests. Please try again in a moment."`);
      } else {
        err(`❌ (${walletCfg.wallet}) status=${resp.status} error="${lastError}"`);
      }
      return;
    }
  }

  // Launch worker pool
  for (let i = 0; i < maxWorkers; i++) {
    workers.push(
      (async () => {
        while (work.length > 0) {
          // Stop if cap reached
          if (earned >= dailyCap) break;
          const next = work.shift();
          if (next == null) break;
          await runOne(next);
        }
      })()
    );
  }

  await Promise.all(workers);

  // If we exactly hit the cap, add a friendly line (matching your logs)
  if (earned >= dailyCap) {
    info(`🏁 CAP reached for ${walletCfg.wallet} → ${earned}/${dailyCap}`);
  }

  return {
    wallet: walletCfg.wallet,
    token,
    earned,
    shotsDone,
    shotsTried,
    lastBalance,
    lastError,
  };
}

// --------------------------- Logging & Summary ----------------------------

async function writeDailySummary(
  date: Date,
  cfg: AutoFarmConfig,
  perWallet: PerWalletRun[]
) {
  const totals = {
    wallets: perWallet.length,
    successShots: perWallet.reduce((a, w) => a + w.shotsDone, 0),
    failedShots: perWallet.reduce((a, w) => a + Math.max(0, w.shotsTried - w.shotsDone), 0),
    totalEarned: perWallet.reduce((a, w) => a + w.earned, 0),
  };

  const out = {
    date: date.toISOString(),
    farmType: cfg.farmType,
    amountPerShot: cfg.amountPerShot,
    bursts: cfg.bursts,
    concurrency: cfg.concurrency,
    dailyCap: cfg.dailyCap,
    baseUrl: cfg.baseUrl,
    totals,
    perWallet: Object.fromEntries(
      perWallet.map((w) => [
        w.wallet,
        {
          wallet: w.wallet,
          token: w.token ?? "STATIC_JWT_TOKEN_IF_YOU_HAVE",
          earned: w.earned,
          shotsDone: w.shotsDone,
          shotsTried: w.shotsTried,
          lastBalance: w.lastBalance,
          lastError: w.lastError,
        },
      ])
    ),
  };

  const logsDir = path.resolve(__dirname, "logs");
  await fsp.mkdir(logsDir, { recursive: true });
  const file = path.resolve(logsDir, `${date.toISOString().slice(0, 10)}.json`);
  await fsp.writeFile(file, JSON.stringify(out, null, 2), "utf8");
  console.log(`📄 Saved summary → ${path.relative(process.cwd(), file)}`);
}

// ------------------------------- Main -------------------------------------

(async function main() {
  banner();

  const DRY_RUN = parseBoolEnv("DRY_RUN", false);
  const start = new Date();
  const session = makeSessionId();

  // Load config
  let cfg: AutoFarmConfig;
  try {
    cfg = await loadConfig();
  } catch (e: any) {
    err(`Failed to load config: ${e?.message || String(e)}`);
    process.exit(1);
    return;
  }

  console.log(nowTs(), "[INFO]", "==============================================");
  info(
    `🚀 AutoFarm run started (session: ${session})`
  );

  info(
    `baseUrl=${cfg.baseUrl} | type=${cfg.farmType} | amount=${cfg.amountPerShot} | bursts=${cfg.bursts} | conc=${cfg.concurrency} | cap=${cfg.dailyCap}`
  );

  // Helpful header lines (explicit, so users can see ENV wallet selection)
  const walletsList = cfg.wallets.map((w) => w.wallet);
  console.log(`${nowTs()} using wallets=[${walletsList.join(",")}]`);
  if (DRY_RUN) {
    console.log(`${nowTs()} DRY-RUN mode: no network calls (no login, no earn)`);
  }

  // Build API
  const api = new Api(cfg.baseUrl, DRY_RUN);

  // Run per-wallet (sequential to keep logs tidy; internal shots are concurrent)
  const perWallet: PerWalletRun[] = [];
  for (const w of cfg.wallets) {
    // Proactive "token ready" line only when we truly obtained a token (in farmWallet)
    const res = await farmWallet(api, cfg, w, session);
    perWallet.push(res);
  }

  // Write daily summary
  await writeDailySummary(start, cfg, perWallet);

  // Final tallies
  const totalSuccess = perWallet.reduce((a, w) => a + w.shotsDone, 0);
  const totalTried = perWallet.reduce((a, w) => a + w.shotsTried, 0);
  const totalEarned = perWallet.reduce((a, w) => a + w.earned, 0);

  info(
    `🌾 Run done → successShots=${totalSuccess}, failedShots=${Math.max(
      0,
      totalTried - totalSuccess
    )}, totalEarned=${totalEarned}`
  );
  console.log(nowTs(), "[INFO]", "==============================================");

  // Clean exit
  if (perWallet.some((w) => w.lastError)) {
    // Non-zero exit code to indicate partial failure (useful for CI)
    process.exit(2);
  } else {
    process.exit(0);
  }
})().catch((e) => {
  err(`Unexpected error: ${e?.stack || e?.message || String(e)}`);
  process.exit(1);
});
