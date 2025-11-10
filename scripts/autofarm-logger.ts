/**
 * AutoFarm Logger (full version with English comments)
 * ----------------------------------------------------
 * Reads the latest JSON summary (scripts/logs/YYYY-MM-DD.json)
 * and emits a compact CSV line per wallet for daily accumulation.
 *
 * NOTE:
 * - This script is optional because the scheduler already writes a per-wallet CSV.
 * - Kept as a utility for custom formats or external pipelines.
 */

import fs from "fs";
import path from "path";

type PerWallet = Record<
  string,
  {
    wallet: string;
    token?: string;
    earned?: number;
    shotsDone?: number;
    shotsTried?: number;
    lastBalance?: number;
    lastError?: string;
  }
>;

type SummaryFile = {
  date: string;
  farmType: string;
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
  perWallet: PerWallet;
};

function isoDateOnly(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function latestJsonPath(): string | null {
  const logDir = path.resolve(process.cwd(), "scripts/logs");
  if (!fs.existsSync(logDir)) return null;
  const files = fs
    .readdirSync(logDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(logDir, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0] ?? null;
}

async function main() {
  const latest = latestJsonPath();
  if (!latest) {
    console.log("No JSON summary found under scripts/logs");
    return;
  }
  const content = fs.readFileSync(latest, "utf8");
  const parsed: SummaryFile = JSON.parse(content);

  const date = parsed.date || new Date().toISOString();
  const dateOnly = date.slice(0, 10);
  const totals = parsed.totals || { totalEarned: 0 };

  const rows: string[] = [];
  rows.push("date,wallet,earned,done,failed,totalEarned");
  for (const [wallet, wdata] of Object.entries(parsed.perWallet || {})) {
    const earned = wdata.earned ?? 0;
    const done = wdata.shotsDone ?? 0;
    const tried = wdata.shotsTried ?? 0;
    const failed = Math.max(0, tried - done);
    const line = `${dateOnly},${wallet},${earned},${done},${failed},${totals.totalEarned ?? 0}`;
    rows.push(line);
  }

  const outPath = path.resolve(process.cwd(), "scripts/logs", `${isoDateOnly()}.logger.csv`);
  fs.writeFileSync(outPath, rows.join("\n") + "\n", "utf8");
  console.log(`Wrote → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
