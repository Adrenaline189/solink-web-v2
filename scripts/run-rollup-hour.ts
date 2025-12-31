import { rollupHourPoints } from "../server/rollup/rollup-hour";

function hourStartUTC(d: Date) {
  const x = new Date(d);
  x.setUTCMinutes(0, 0, 0);
  return x;
}

async function main() {
  const iso = process.argv[2];
  if (!iso) {
    console.log('Usage: npx tsx scripts/run-rollup-hour.ts "2025-12-14T18:14:00.000Z"');
    process.exit(1);
  }

  const occurredAt = new Date(iso);
  const hourUtc = hourStartUTC(occurredAt);

  const result = await rollupHourPoints(hourUtc);
  console.log(result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
