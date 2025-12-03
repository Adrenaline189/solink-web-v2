// scripts/rollup-worker.ts
import "dotenv/config";
import { startHourlyWorker } from "./rollup-hourly";

function now() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

(async () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error(`[${now()}] ❌ Missing REDIS_URL`);
    process.exit(1);
  }

  console.log(`[${now()}] 🧵 rollup-worker starting…`);
  console.log(`[${now()}] 🔗 REDIS_URL: ${redisUrl.split("@").pop()}`);

  const worker = startHourlyWorker();

  worker.on("ready", () => console.log(`[${now()}] ✅ worker ready`));
  worker.on("error", (e) => console.error(`[${now()}] 💥 worker error`, e));
  worker.on("failed", (job, err) =>
    console.warn(`[${now()}] ⚠️ job failed id=${job?.id} name=${job?.name}: ${err?.message}`)
  );
  worker.on("completed", (job, res) =>
    console.log(`[${now()}] 🎉 job done id=${job?.id} →`, res)
  );

  const shutdown = async (sig: string) => {
    console.log(`[${now()}] 🔻 ${sig} → closing worker…`);
    try {
      await worker.close();
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
})();
