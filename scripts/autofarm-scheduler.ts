/**
 * AutoFarm Scheduler — v1.1 (2025-11-10) — English comments
 * ---------------------------------------------------------
 * Key behaviors:
 * - DRY_RUN=1 → no network at all (no login, no earn)
 * - WALLETS=alice,bob → run only those wallets
 * - Clear logging: shows SCRIPT_VERSION and using wallets=[...]
 * - Resilient backoff for 429/5xx with jitter (real mode only)
 * - Saves .json summary and per-wallet CSV under scripts/logs/
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";

const SCRIPT_VERSION = "autofarm-scheduler v1.1";

type WalletCfg = {
  wallet: string;
  token?: string;
};

type RunStat = {
  wallet: string;
  token?: string;
  earned: number;
  shotsDone: number;
  shotsTried: number;
  lastBalance?: number;
  lastError?: string;
};

type Config = {
  baseUrl: string;
  type: string;
  amount: number;
  bursts: number;
  concurrency: number;
  cap: number;
  adaptiveMode?: boolean;
  rate?: { rps: number; bucketSize: number; refillEveryMs: number };
  wallets: WalletCfg[];
};

const LOG_DIR = path.resolve(process.cwd(), "scripts/logs");

function ts() {
  const d = new Date();
  return `[${d.toTimeString().split(" ")[0]}]`;
}
function isoDateOnly(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
function ensureLogsDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}
function appendTextLog(line: string) {
  ensureLogsDir();
  const file = path.join(LOG_DIR, `${isoDateOnly()}.log`);
  fs.appendFileSync(file, line + "\n", "utf8");
}

function saveSummary(
  date: Date,
  farmType: string,
  cfg: Config,
  totals: { successShots: number; failedShots: number; totalEarned: number; wallets: number },
  perWallet: Record<string, RunStat>
) {
  ensureLogsDir();
  const jsonPath = path.join(LOG_DIR, `${isoDateOnly(date)}.json`);
  const csvPath = path.join(LOG_DIR, `${isoDateOnly(date)}-per-wallet.csv`);

  const summary = {
    date: date.toISOString(),
    farmType,
    amountPerShot: cfg.amount,
    bursts: cfg.bursts,
    concurrency: cfg.concurrency,
    dailyCap: cfg.cap,
    baseUrl: cfg.baseUrl,
    totals,
    perWallet,
    scriptVersion: SCRIPT_VERSION,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), "utf8");

  const rows: string[] = [];
  rows.push("wallet,earned,shotsDone,shotsTried,lastBalance,lastError");
  for (const [wallet, w] of Object.entries(perWallet)) {
    rows.push(
      [
        wallet,
        w.earned ?? 0,
        w.shotsDone ?? 0,
        w.shotsTried ?? 0,
        w.lastBalance ?? "",
        w.lastError ?? "",
      ].join(",")
    );
  }
  fs.writeFileSync(csvPath, rows.join("\n") + "\n", "utf8");

  console.log(`📄 Saved summary → ${jsonPath}`);
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
function jittered(baseMs: number) {
  const jitter = Math.floor(Math.random() * 200);
  return baseMs + jitter;
}

async function pool<T, R>(items: T[], limit: number, worker: (item: T, idx: number) => Promise<R>): Promise<R[]> {
  const ret: R[] = new Array(items.length);
  let next = 0;
  async function runner() {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      ret[i] = await worker(items[i], i);
    }
  }
  const conc = Math.min(limit, Math.max(1, items.length));
  await Promise.all(Array.from({ length: conc }, runner));
  return ret;
}

function loadConfig(): Config {
  const cfgPath = path.resolve(process.cwd(), "scripts/config/autofarm.config.json");
  if (!fs.existsSync(cfgPath)) throw new Error(`Config not found at ${cfgPath}`);
  const base = JSON.parse(fs.readFileSync(cfgPath, "utf8")) as Config;

  const envWallets = process.env.WALLETS?.trim();
  const wallets =
    envWallets && envWallets.length > 0
      ? envWallets.split(",").map((w) => ({ wallet: w.trim() })).filter((w) => !!w.wallet)
      : base.wallets;

  return {
    ...base,
    baseUrl: process.env.BASE_URL?.trim() || base.baseUrl,
    type: process.env.TYPE?.trim() || base.type,
    amount: process.env.AMOUNT ? Number(process.env.AMOUNT) : base.amount,
    bursts: process.env.BURSTS ? Number(process.env.BURSTS) : base.bursts,
    concurrency: process.env.CONCURRENCY ? Number(process.env.CONCURRENCY) : base.concurrency,
    cap: process.env.CAP ? Number(process.env.CAP) : base.cap,
    wallets,
  };
}

async function login(baseUrl: string, wallet: string): Promise<string> {
  const url = `${baseUrl}/api/auth/demo-login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet }),
  });
  if (!res.ok) throw new Error(`Login failed (${res.status})`);
  const data = (await res.json()) as { token?: string };
  if (!data?.token) throw new Error("Login OK but token missing");
  return data.token;
}

type EarnResp = { ok: boolean; balance?: number; error?: string };

async function earnOnce(
  baseUrl: string,
  token: string,
  type: string,
  amount: number,
  meta: Record<string, any>
): Promise<EarnResp> {
  const url = `${baseUrl}/api/points/earn`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type, amount, meta }),
  });

  if (res.status === 429) return { ok: false, error: "429" };
  if (res.status === 401) return { ok: false, error: "401" };
  if (!res.ok) return { ok: false, error: String(res.status) };

  const data = (await res.json()) as { ok?: boolean; balance?: number };
  return { ok: !!data?.ok, balance: data?.balance };
}

async function runWallet(
  cfg: Config,
  wallet: WalletCfg,
  token: string | undefined,
  sessionId: string,
  dryRun: boolean
): Promise<RunStat> {
  const stat: RunStat = { wallet: wallet.wallet, token, earned: 0, shotsDone: 0, shotsTried: 0 };

  // DRY-RUN: simulate everything, never touch network.
  if (dryRun) {
    for (let i = 0; i < cfg.bursts; i++) {
      if (stat.earned >= cfg.cap) {
        console.log(`${ts()} ${chalk.green("🏁 CAP reached for " + wallet.wallet)} → ${stat.earned}/${cfg.cap}`);
        break;
      }
      stat.shotsTried++;
      stat.earned += cfg.amount;
      stat.shotsDone++;
      stat.lastBalance = (stat.lastBalance ?? 0) + cfg.amount;
      console.log(
        `${ts()} ${chalk.cyan("✅ +"+cfg.amount)} (${wallet.wallet}) shots=${stat.shotsDone}/${cfg.bursts}, earned=${stat.earned}/${cfg.cap} balance=${stat.lastBalance}`
      );
    }
    return stat;
  }

  // REAL MODE:
  if (!token) {
    stat.lastError = "No token";
    return stat;
  }

  for (let i = 0; i < cfg.bursts; i++) {
    if (stat.earned >= cfg.cap) {
      console.log(`${ts()} ${chalk.green("🏁 CAP reached for " + wallet.wallet)} → ${stat.earned}/${cfg.cap}`);
      break;
    }

    stat.shotsTried++;

    const maxRetries = 6;
    let attempt = 0;
    while (true) {
      attempt++;
      const resp = await earnOnce(cfg.baseUrl, token, cfg.type, cfg.amount, { session: sessionId });

      if (resp.ok) {
        stat.earned += cfg.amount;
        stat.shotsDone++;
        if (typeof resp.balance === "number") stat.lastBalance = resp.balance;
        console.log(
          `${ts()} ${chalk.cyan("✅ +"+cfg.amount)} (${wallet.wallet}) shots=${stat.shotsDone}/${cfg.bursts}, earned=${stat.earned}/${cfg.cap} balance=${resp.balance ?? ""}`
        );
        break;
      }

      if (resp.error === "401") {
        console.log(`${ts()} ${chalk.yellow(`❌ (${wallet.wallet}) status=401 error="Unauthorized"`)}`);
        stat.lastError = "Unauthorized";
        break;
      }

      const is429 = resp.error === "429";
      if (attempt <= maxRetries && (is429 || Number(resp.error) >= 500)) {
        const schedule = [500, 1100, 2100, 4100, 8100, 15100];
        const wait = jittered(schedule[Math.min(attempt - 1, schedule.length - 1)]);
        console.log(`${ts()} ${chalk.yellow(`⏳ Backoff (${attempt}/${maxRetries}) for status ${resp.error} → ${wait}ms`)}`);
        await sleep(wait);
      } else {
        console.log(`${ts()} ${chalk.yellow(`❌ (${wallet.wallet}) status=${resp.error ?? "unknown"} error="Too many requests or server error."`)}`);
        stat.lastError = resp.error ?? "error";
        break;
      }
    }
  }

  return stat;
}

async function main() {
  const start = new Date();
  const cfg = loadConfig();
  const dryRun = String(process.env.DRY_RUN || "").trim() === "1";

  console.log(`${ts()} ${chalk.blue("Loaded config file:")} ${path.resolve(process.cwd(), "scripts/config/autofarm.config.json")}`);
  console.log(`${ts()} ==============================================`);
  const sessionId = `dash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  console.log(`${ts()} 🚀 AutoFarm run started (session: ${sessionId})`);
  console.log(`${ts()} ${chalk.magenta(SCRIPT_VERSION)}`);
  console.log(`${ts()} baseUrl=${cfg.baseUrl} | type=${cfg.type} | amount=${cfg.amount} | bursts=${cfg.bursts} | conc=${cfg.concurrency} | cap=${cfg.cap}`);

  const walletsList = (cfg.wallets ?? []).map((w) => w.wallet).join(", ");
  console.log(`${ts()} using wallets=[${walletsList}]`);
  if (dryRun) console.log(`${ts()} ${chalk.yellow("DRY-RUN mode: no network calls (no login, no earn)")}`);
  if (cfg.adaptiveMode) console.log(`${ts()} ${chalk.yellow("Adaptive mode enabled (informational only)")}`);

  // Token preparation:
  const walletTokens = new Map<string, string>();
  const walletRuns = new Map<string, RunStat>();

  if (!dryRun) {
    // REAL: login for tokens
    for (const w of cfg.wallets ?? []) {
      try {
        const tok =
          w.token && w.token !== "STATIC_JWT_TOKEN_IF_YOU_HAVE"
            ? w.token
            : await login(cfg.baseUrl, w.wallet);
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
    }
  } else {
    // DRY: don't touch network; give fake tokens just for display
    for (const w of cfg.wallets ?? []) {
      walletTokens.set(w.wallet, "DRYRUN");
    }
  }

  // Run with bounded concurrency
  const selected = cfg.wallets ?? [];
  await pool(selected, cfg.concurrency, async (w) => {
    const token = walletTokens.get(w.wallet);
    const stat = await runWallet(cfg, w, token, sessionId, dryRun);
    walletRuns.set(w.wallet, stat);
  });

  // Aggregate totals
  let successShots = 0;
  let failedShots = 0;
  let totalEarned = 0;
  for (const st of walletRuns.values()) {
    successShots += st.shotsDone;
    failedShots += Math.max(0, st.shotsTried - st.shotsDone);
    totalEarned += st.earned;
  }

  // Persist logs
  appendTextLog(`${ts()} [INFO] ==============================================`);
  appendTextLog(`${ts()} [INFO] ${SCRIPT_VERSION}`);
  appendTextLog(`${ts()} [INFO] session=${sessionId}`);
  appendTextLog(`${ts()} [INFO] baseUrl=${cfg.baseUrl} type=${cfg.type} amount=${cfg.amount} bursts=${cfg.bursts} conc=${cfg.concurrency} cap=${cfg.cap}`);
  appendTextLog(`${ts()} [INFO] wallets=[${walletsList}]`);
  for (const st of walletRuns.values()) {
    appendTextLog(
      `${ts()} [WALLET] ${st.wallet} tried=${st.shotsTried} done=${st.shotsDone} earned=${st.earned} lastBalance=${st.lastBalance ?? ""} lastError=${st.lastError ?? ""}`
    );
  }

  saveSummary(start, cfg.type, cfg, { wallets: selected.length, successShots, failedShots, totalEarned }, Object.fromEntries(walletRuns));

  console.log(`${ts()} [INFO] 🌾 Run done → successShots=${successShots}, failedShots=${failedShots}, totalEarned=${totalEarned}`);
  console.log(`${ts()} [INFO] ==============================================`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
