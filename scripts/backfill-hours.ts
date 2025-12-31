// scripts/backfill-hours.ts
import "dotenv/config";

type RollupHourResult = { hourUtc: Date | string | number; users: number };

function hoursOfDayUTC(day: Date): Date[] {
  const hours: Date[] = [];
  const base = new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, 0, 0, 0)
  );
  for (let h = 0; h < 24; h++) hours.push(new Date(base.getTime() + h * 3600_000));
  return hours;
}

function asIso(x: any) {
  try {
    const d = x instanceof Date ? x : new Date(x);
    return Number.isFinite(d.getTime()) ? d.toISOString() : String(x);
  } catch {
    return String(x);
  }
}

async function loadRollupFn(): Promise<(hour?: Date) => Promise<RollupHourResult>> {
  const mod: any = await import("../server/rollup/rollup-hour");
  const fn = mod.rollupHourPoints; // ✅ ของจริง

  if (typeof fn !== "function") {
    console.error("[backfill] Available exports:", Object.keys(mod));
    throw new Error("rollupHourPoints export not found");
  }

  return fn;
}

async function main() {
  const arg = process.argv[2]; // YYYY-MM-DD
  const day = arg ? new Date(`${arg}T00:00:00Z`) : new Date();

  console.log("[backfill] day =", day.toISOString().slice(0, 10));

  const rollup = await loadRollupFn();
  const hours = hoursOfDayUTC(day);

  for (const hour of hours) {
    const res = await rollup(hour);
    console.log(`[backfill] hour=${asIso(res.hourUtc)} users=${res.users}`);
  }

  console.log("[backfill] done");
}

main().catch((e) => {
  console.error("[backfill] error:", e?.message || e);
  process.exit(1);
});
