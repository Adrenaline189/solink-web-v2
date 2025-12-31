export {};

/**
 * Run:
 *   CRON_KEY=xxx BASE_URL=http://localhost:3000 tsx scripts/queue-rollup-day.ts
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const CRON_KEY = process.env.CRON_KEY || "";

async function main() {
  if (!CRON_KEY) {
    console.error("❌ CRON_KEY missing");
    process.exit(1);
  }

  const res = await fetch(`${BASE_URL}/api/cron/rollup-daily`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CRON-KEY": CRON_KEY,
    },
    body: JSON.stringify({}),
  });

  const json = await res.json().catch(() => ({}));
  console.log("status:", res.status);
  console.log(JSON.stringify(json, null, 2));

  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
