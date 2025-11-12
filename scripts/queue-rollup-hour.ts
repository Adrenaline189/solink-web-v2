import { enqueueHourlyRollup } from "./rollup-hourly.js";

function parseHourIso(): string {
  // ใช้แบบ: npm run queue:rollup:hour -- 2025-11-11T14:00:00Z
  const arg = process.argv[2];
  const env = process.env.HOUR_ISO;
  const iso = arg || env;
  if (!iso) {
    console.error("Usage: npm run queue:rollup:hour -- 2025-11-11T14:00:00Z  (or set HOUR_ISO=... )");
    process.exit(1);
  }
  // validate
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    console.error("Invalid hour ISO:", iso);
    process.exit(1);
  }
  // normalize to top-of-hour
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

(async () => {
  const hourIso = parseHourIso();
  await enqueueHourlyRollup(hourIso);
  console.log("✅ queued rollup for:", hourIso);
})();
