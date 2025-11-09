// scripts/autofarm-logger.ts
import fs from "node:fs";
import path from "node:path";
import { RunSummary } from "./types";

const LOG_DIR = path.resolve(process.cwd(), "scripts", "logs");

function ensureDirSync(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function redactSecrets<T>(obj: T): T {
  // clone แบบปลอดภัย
  const clone: any = JSON.parse(JSON.stringify(obj));

  // ตัด JWT รูปแบบ xxx.yyy.zzz
  const redactJWT = (s: unknown) =>
    typeof s === "string" && /^\S+\.\S+\.\S+$/.test(s) ? "****JWT_REDACTED****" : s;

  if (clone?.perWallet) {
    for (const k of Object.keys(clone.perWallet)) {
      if (clone.perWallet[k]?.token) clone.perWallet[k].token = "****REDACTED****";
    }
  }

  // ป้องกันหลุดซ้ำในค่าอื่น ๆ
  const serialized = JSON.stringify(clone, (_, v) => redactJWT(v), 2);
  return JSON.parse(serialized);
}

export function writeSummary(summary: RunSummary) {
  ensureDirSync(LOG_DIR);

  const safe = redactSecrets(summary);

  const iso = new Date(summary.date).toISOString().slice(0, 10); // YYYY-MM-DD
  const jsonPath = path.join(LOG_DIR, `${iso}.json`);
  const logPath = path.join(LOG_DIR, `${iso}.log`);
  const csvPath = path.join(LOG_DIR, `${iso}-per-wallet.csv`);

  // JSON
  fs.writeFileSync(jsonPath, JSON.stringify(safe, null, 2), "utf8");

  // Plain log (append)
  const lines: string[] = [];
  lines.push(`[${summary.date}] farmType=${safe.farmType} amount=${safe.amountPerShot} bursts=${safe.bursts} conc=${safe.concurrency} cap=${safe.dailyCap}`);
  lines.push(`Totals: wallets=${safe.totals.wallets} successShots=${safe.totals.successShots} failedShots=${safe.totals.failedShots} totalEarned=${safe.totals.totalEarned}`);
  for (const [wallet, wdata] of Object.entries(safe.perWallet)) {
    lines.push(
      ` - ${wallet}: earned=${wdata.earned} done=${wdata.shotsDone} tried=${wdata.shotsTried}` +
      (wdata.lastBalance != null ? ` lastBalance=${wdata.lastBalance}` : "") +
      (wdata.lastError ? ` lastError="${wdata.lastError}"` : "")
    );
  }
  fs.appendFileSync(logPath, lines.join("\n") + "\n", "utf8");

  // CSV per-wallet
  const header = `wallet,earned,done,tried,lastBalance,lastError\n`;
  const rows: string[] = [];
  for (const [wallet, wdata] of Object.entries(safe.perWallet)) {
    rows.push(
      [
        wallet,
        wdata.earned ?? 0,
        wdata.shotsDone ?? 0,
        wdata.shotsTried ?? 0,
        wdata.lastBalance ?? "",
        (wdata.lastError ?? "").toString().replaceAll('"', '""'),
      ]
        .map((v) => (typeof v === "string" && v.includes(",") ? `"${v}"` : v))
        .join(",")
    );
  }
  fs.writeFileSync(csvPath, header + rows.join("\n"), "utf8");

  return { jsonPath, logPath, csvPath };
}
