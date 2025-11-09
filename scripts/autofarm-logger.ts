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
    const totalEarned = data.totals?.earned ?? 0;
    const wallets = Object.entries(data.wallets || {});
    for (const [wallet, wdata] of wallets)
      rows.push(
        `${date},${wallet},${wdata["earned"] ?? 0},${wdata["done"] ?? 0},${(wdata["tried"] ?? 0) - (wdata["done"] ?? 0)},${totalEarned}`
      );
  }

  fs.writeFileSync(csvFile, rows.join("\n"));
  console.log(chalk.green(`[LOG] Updated summary CSV (${rows.length - 1} rows)`));
}
