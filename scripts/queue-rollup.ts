// scripts/queue-rollup.ts
import "dotenv/config";
import { enqueueHourlyRollup } from "./rollup-hourly";

(async () => {
  await enqueueHourlyRollup(); // จะ queue ชั่วโมงล่าสุดอัตโนมัติ
  console.log("✅ queued hourly rollup job");
})();
