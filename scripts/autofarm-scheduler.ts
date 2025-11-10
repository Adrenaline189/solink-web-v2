// scripts/autofarm-scheduler.ts
// -------------------------------------------------------------
// AutoFarm Scheduler — v1.1 (2025-11-10)
// Purpose:
//   - Drive demo-login (if no token provided) and send "earn" bursts
//   - Respect per-wallet daily cap
//   - Handle 429 backoff (exponential + jitter)
//   - DRY_RUN mode = no network calls (pure simulation)
//   - Environment overrides: WALLETS, BURSTS, CONCURRENCY, AMOUNT, CAP, BASE_URL, TYPE
//
// Why v1.1 matters:
//   - Prints a clear version banner + "using wallets=[...]"
//   - DRY_RUN guarantees **no** network calls (you will never see 401/429)
//   - Honors WALLETS=... from env (single/multiple, comma-separated)
//   - Saves JSON summary into scripts/logs/YYYY-MM-DD.json
// -------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPT_VERSION = "autofarm-scheduler v1.1";

// -----------------------------
// Types
// -----------------------------
type FarmType = "extension_farm";

interface WalletInput {
  wallet: string;
  token?: string; // Optional: if omitted, we attempt demo-login
}

interface Config {
  baseUrl: string;
  farmType: FarmType;
  amountPerShot: number;
  bursts: number;
  concurrency: number;
  dailyCap: number;
  wallets: WalletInput[];
}

interface EarnResponse {
  ok: boolean;
  balance?: number;
  error?: string;
}

interface LoginResponse {
  token?: string;
  ok?: boolean;
  error?: string;
}

// -----------------------------
// Helpers
// -----------------------------
function nowISO() {
  return new Date().toISOString();
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function timeTag() {
  const d = new Date();
  return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
}

function info(msg: string) {
  console.log(`${timeTag()} [INFO] ${msg}`);
}

function warn(msg: string) {
  console.warn(`${timeTag()} [WARN] ${msg}`);
}

function loadJSON<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf8")) as T;
}

function getLogFilePath(): string {
  const d = new Date();
  const name = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
  const dir = path.join(__dirname, "logs");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, name);
}

function jitter(ms: number): number {
  // Add ±20% jitter to reduce thundering herd
  const delta = ms * 0.2;
  return Math.round(ms + (Math.random() * 2 - 1) * delta);
}

function parseEnvList(name: string): string[] | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// -----------------------------
// Network (fetch) helpers
// -----------------------------
async function httpJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : {};
    return { res, json };
  } catch {
    return { res, json: { ok: false, error: `Invalid JSON: ${text.slice(0, 120)}` } };
  }
}

async function demoLogin(baseUrl: string, wallet: string): Promise<string> {
  const url = `${baseUrl}/api/auth/demo-login`;
  const { res, json } = await httpJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet }),
  });
  if (!res.ok) {
    throw new Error(`demo-login failed (${res.status}) ${json?.error || ""}`.trim());
  }
  const data = json as LoginResponse;
  if (!data?.token) {
    throw new Error(`demo-login returned no token for wallet=${wallet}`);
  }
  return data.token!;
}

async function earnOnce(baseUrl: string, token: string, farmType: FarmType, amount: number) {
  const url = `${baseUrl}/api/points/earn`;
  const { res, json } = await httpJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: farmType,
      amount,
      meta: { session: "scheduler" },
    }),
  });
  return { res, json: json as EarnResponse };
}

async function getBalance(baseUrl: string, token: string) {
  const url = `${baseUrl}/api/points/balance`;
  const { res, json } = await httpJson(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return undefined;
  return (json as any)?.balance as number | undefined;
}

// -----------------------------
// Main
// -----------------------------
async function main() {
  const configPath = path.join(__dirname, "config", "autofarm.config.json");
  const cfg = loadJSON<Config>(configPath);

  // Environment overrides (highest priority)
  const walletsEnv = parseEnvList("WALLETS");
  const baseUrl = process.env.BASE_URL || cfg.baseUrl;
  const farmType = (process.env.TYPE as FarmType) || cfg.farmType;
  const amountPerShot = Number(process.env.AMOUNT ?? cfg.amountPerShot);
  const bursts = Number(process.env.BURSTS ?? cfg.bursts);
  const concurrency = Number(process.env.CONCURRENCY ?? cfg.concurrency);
  const dailyCap = Number(process.env.CAP ?? cfg.dailyCap);
  const dryRun = process.env.DRY_RUN === "1";

  // Merge wallets: if WALLETS env is set, rebuild list from config using those names
  const wallets: WalletInput[] =
    walletsEnv?.length
      ? walletsEnv.map((w) => {
          const inCfg = cfg.wallets.find((x) => x.wallet === w);
          return inCfg ? { ...inCfg, wallet: w } : { wallet: w };
        })
      : cfg.wallets;

  // Banner
  console.log(`${timeTag()} ${SCRIPT_VERSION}`);
  console.log(`${timeTag()} using wallets=[${wallets.map((w) => w.wallet).join(", ")}]`);
  console.log(
    `${timeTag()} ${dryRun ? "DRY-RUN mode: no network calls (no login, no earn)" : "LIVE mode"}`
  );

  info(`Loaded config file: ${configPath}`);
  info("==============================================");
  info(
    `🚀 AutoFarm run started (session: dash-${Date.now()}-${Math.random().toString(36).slice(2, 6)})`
  );
  info(
    `baseUrl=${baseUrl} | type=${farmType} | amount=${amountPerShot} | bursts=${bursts} | conc=${concurrency} | cap=${dailyCap}`
  );

  // State for final summary
  let globalSuccess = 0;
  let globalFailed = 0;
  let globalEarned = 0;
  const perWallet: Record<
    string,
    {
      wallet: string;
      token?: string;
      earned: number;
      shotsDone: number;
      shotsTried: number;
      lastBalance?: number;
      lastError?: string;
    }
  > = {};

  // Prepare tokens (or mark to login later)
  for (const w of wallets) {
    perWallet[w.wallet] = {
      wallet: w.wallet,
      token: w.token,
      earned: 0,
      shotsDone: 0,
      shotsTried: 0,
    };
  }

  // Concurrency control per wallet (simple windowed queue)
  const limiter = (limit: number) => {
    let running = 0;
    const queue: (() => Promise<void>)[] = [];
    const runNext = async () => {
      if (running >= limit || queue.length === 0) return;
      const job = queue.shift()!;
      running++;
      try {
        await job();
      } finally {
        running--;
        // Let the next tick schedule more
        setImmediate(runNext);
      }
    };
    return (job: () => Promise<void>) => {
      queue.push(job);
      runNext();
    };
  };

  for (const w of wallets) {
    const L = limiter(concurrency);

    // Acquire token if needed (LIVE only)
    if (!dryRun && !perWallet[w.wallet].token) {
      try {
        info(`🔐 token ready for ${w.wallet.slice(0, 10)}...`);
        const token = await demoLogin(baseUrl, w.wallet);
        perWallet[w.wallet].token = token;
      } catch (e: any) {
        perWallet[w.wallet].lastError = e?.message || "login error";
        warn(`❌ demo-login failed (${w.wallet}) → ${perWallet[w.wallet].lastError}`);
        // Continue; we will fail earns with 401 later, but still record logs
      }
    } else {
      info(`🔐 token ready for ${w.wallet.slice(0, 10)}...`);
    }

    // Compute per-wallet target (min between bursts*amount and dailyCap)
    const theoretical = bursts * amountPerShot;
    const target = Math.min(dailyCap, theoretical);

    // Schedule burst jobs
    for (let i = 0; i < bursts; i++) {
      L(async () => {
        perWallet[w.wallet].shotsTried++;

        // Respect cap (based on earned)
        if (perWallet[w.wallet].earned >= target) return;

        if (dryRun) {
          // Simulate success
          perWallet[w.wallet].shotsDone++;
          perWallet[w.wallet].earned += amountPerShot;
          globalSuccess++;
          globalEarned += amountPerShot;
          info(
            `✅ +${amountPerShot} (${w.wallet}) shots=${perWallet[w.wallet].shotsDone}/${bursts}, earned=${perWallet[w.wallet].earned}/${target} balance=${perWallet[w.wallet].lastBalance ?? "—"}`
          );
          return;
        }

        // LIVE: perform earn with backoff on 429
        let attempt = 0;
        const maxRetries = 6;
        let done = false;

        while (!done) {
          attempt++;

          // Cap check again before calling API
          if (perWallet[w.wallet].earned >= target) break;

          const token = perWallet[w.wallet].token;
          if (!token) {
            perWallet[w.wallet].lastError = "No token";
            globalFailed++;
            warn(`❌ (${w.wallet}) status=401 error="Unauthorized (no token)"`);
            break;
          }

          const { res, json } = await earnOnce(baseUrl, token, farmType, amountPerShot);

          if (res.status === 200 && json?.ok) {
            perWallet[w.wallet].shotsDone++;
            perWallet[w.wallet].earned += amountPerShot;
            globalSuccess++;
            // Try to fetch balance occasionally to show progress
            if (perWallet[w.wallet].shotsDone % 2 === 0) {
              const bal = await getBalance(baseUrl, token);
              if (typeof bal === "number") perWallet[w.wallet].lastBalance = bal;
            }
            info(
              `✅ +${amountPerShot} (${w.wallet}) shots=${perWallet[w.wallet].shotsDone}/${bursts}, earned=${perWallet[w.wallet].earned}/${target} balance=${perWallet[w.wallet].lastBalance ?? "—"}`
            );
            done = true;
          } else if (res.status === 401) {
            // 401 – most common cause: invalid/placeholder token or server does not allow this wallet
            perWallet[w.wallet].lastError = json?.error || "Unauthorized";
            globalFailed++;
            warn(`❌ (${w.wallet}) status=401 error="${perWallet[w.wallet].lastError}"`);
            done = true; // give up this shot (do not retry 401)
          } else if (res.status === 429) {
            // 429 – too many requests: backoff with exponential + jitter
            if (attempt > maxRetries) {
              perWallet[w.wallet].lastError = json?.error || "Too many requests";
              globalFailed++;
              warn(`❌ (${w.wallet}) status=429 error="${perWallet[w.wallet].lastError}"`);
              break;
            }
            const base = [600, 1100, 2100, 4200, 8100, 15100][Math.min(attempt - 1, 5)];
            const wait = jitter(base);
            warn(`⏳ Backoff (${attempt}/${maxRetries}) for status 429 → ${wait}ms`);
            await sleep(wait);
            // loop and retry
          } else {
            // Other errors – record and stop this shot
            perWallet[w.wallet].lastError =
              json?.error || `HTTP ${res.status}`;
            globalFailed++;
            warn(`❌ (${w.wallet}) status=${res.status} error="${perWallet[w.wallet].lastError}"`);
            done = true;
          }
        }
      });
    }

    // Wait a bit between wallets to stagger traffic
    await sleep(50);
  }

  // Very naive drain: wait until no more progress is made
  // (For large runs a proper queue drain/promise-set would be cleaner.)
  let last = -1;
  while (globalSuccess + globalFailed !== last) {
    last = globalSuccess + globalFailed;
    await sleep(200);
  }

  // Finalize: compute balances for DRY_RUN we leave as-is
  if (!dryRun) {
    for (const w of wallets) {
      const token = perWallet[w.wallet].token;
      if (!token) continue;
      try {
        const b = await getBalance(baseUrl, token);
        if (typeof b === "number") perWallet[w.wallet].lastBalance = b;
      } catch {
        // ignore
      }
    }
  }

  // Prepare summary JSON
  const summary = {
    date: nowISO(),
    farmType,
    amountPerShot,
    bursts,
    concurrency,
    dailyCap,
    baseUrl,
    totals: {
      wallets: wallets.length,
      successShots: globalSuccess,
      failedShots: globalFailed,
      totalEarned: globalEarned,
    },
    perWallet,
  };

  const outPath = getLogFilePath();
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`📄 Saved summary → ${outPath}`);

  info(
    `🌾 Run done → successShots=${globalSuccess}, failedShots=${globalFailed}, totalEarned=${globalEarned}`
  );
  info("==============================================");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
