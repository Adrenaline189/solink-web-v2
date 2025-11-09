/**
 * Log Manager for AutoFarm Scheduler
 * - Rotates old logs (7 days)
 * - Aggregates JSON → CSV summary
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";

export async function updateLogSummary(latestFile: string) {
  const logDir = path.dirname(latestFile);
  const files = fs.readdirSync(logDir).filter((f) => f.endsWith(".json"));

  const csvFile = path.join(logDir, "summary.csv");
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const rows: string[] = [];
  if (!fs.existsSync(csvFile)) rows.push("date,wallet,earned,shotsDone,failedShots,totalEarned");

  for (const f of files) {
    const full = path.join(logDir, f);
    const stat = fs.statSync(full);
    if (stat.mtime.getTime() < cutoff) {
      fs.unlinkSync(full);
      console.log(chalk.gray(`[LOG] Deleted old log: ${f}`));
      continue;
    }

    const data = JSON.parse(fs.readFileSync(full, "utf8"));
    const date = data.date?.split("T")[0] ?? f.replace(".json", "");
    const totalEarned: number = data.totals?.earned ?? 0;
    const wallets: [string, any][] = Object.entries(data.wallets || {});

    for (const [wallet, wdata] of wallets) {
      const earned = (wdata as any)?.earned ?? 0;
      const done = (wdata as any)?.done ?? 0;
      const tried = (wdata as any)?.tried ?? 0;
      const failed = tried - done;
      rows.push(`${date},${wallet},${earned},${done},${failed},${totalEarned}`);
    }
  }

  fs.writeFileSync(csvFile, rows.join("\n"));
  console.log(chalk.green(`[LOG] Updated summary CSV (${rows.length - 1} rows)`));
}
