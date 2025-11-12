import { enqueueHourlyRollup } from "./rollup-hourly.js";

function floorToHour(d = new Date()) {
  const t = new Date(d);
  t.setUTCMinutes(0, 0, 0);
  return t;
}

async function main() {
  const nowHour = floorToHour();
  // ย้อนหลัง 23..0 ชั่วโมง (รวมปัจจุบัน)
  for (let i = 23; i >= 0; i--) {
    const h = new Date(nowHour.getTime() - i * 3600_000);
    const iso = h.toISOString();
    await enqueueHourlyRollup(iso);
    console.log("→ queued", iso);
    await new Promise((r) => setTimeout(r, 100)); // กันยิงถี่เกิน
  }
  console.log("✅ backfill queued for last 24h");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
