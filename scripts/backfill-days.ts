// scripts/backfill-days.ts
import "dotenv/config";
import { rollupDay } from "../server/rollup/rollup-day";

function parseYmd(s: string) {
  // รับรูปแบบ YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo, d, 0, 0, 0, 0));
  if (!Number.isFinite(dt.getTime())) return null;
  return dt;
}

async function main() {
  const arg = process.argv[2]; // YYYY-MM-DD หรือ "7d"
  const todayUtc = new Date();
  const startOfTodayUtc = new Date(Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate(), 0, 0, 0, 0));

  let start: Date;
  let days: number;

  if (!arg || arg === "7d") {
    days = 7;
    start = new Date(startOfTodayUtc.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  } else {
    const d = parseYmd(arg);
    if (!d) {
      console.log('Usage: npx tsx scripts/backfill-days.ts [YYYY-MM-DD|7d]');
      process.exit(1);
    }
    days = 1;
    start = d;
  }

  console.log(`[backfill-days] start=${start.toISOString()} days=${days}`);

  for (let i = 0; i < days; i++) {
    const day = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const res = await rollupDay(day);
    console.log(`[backfill-days] day=${res.dayUtc.toISOString()} users=${res.users}`);
  }

  console.log("[backfill-days] done");
}

main().catch((e) => {
  console.error("[backfill-days] error:", e);
  process.exit(1);
});
