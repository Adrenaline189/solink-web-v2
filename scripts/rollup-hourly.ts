import { Queue, Worker, QueueScheduler, JobsOptions } from "bullmq";
import { getRedis } from "@/lib/redis";
import { prisma } from "@/server/db";

const connection = getRedis();
const queueName = "metrics-rollup-hourly";

export const queue = new Queue(queueName, { connection });
new QueueScheduler(queueName, { connection });

// ใช้จาก CRON route
export async function enqueueHourlyRollup(hourIso?: string) {
  const opts: JobsOptions = { removeOnComplete: 200, removeOnFail: 100 };
  await queue.add("rollup", { hourIso }, opts);
}

// Worker (จะถูก import ตอน runtime ฝั่ง Node.js เท่านั้น)
export function startHourlyWorker() {
  return new Worker(
    queueName,
    async (job) => {
      const hourIso =
        job.data.hourIso ??
        new Date(Date.now() - (Date.now() % 3600000)).toISOString();

      const hourStart = new Date(hourIso);
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 3600_000);

      // รวมแต้มต่อ user ในช่วงชั่วโมง
      const grouped = await prisma.pointEvent.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: hourStart, lt: hourEnd } },
        _sum: { amount: true },
      });

      // global row (ทั้งระบบ)
      const total = grouped.reduce((s, g) => s + (g._sum.amount ?? 0), 0);
      await prisma.metricsHourly.upsert({
        where: { hourUtc_userId_unique: { hourUtc: hourStart, userId: null } },
        create: {
          hourUtc: hourStart,
          userId: null,
          pointsEarned: total,
          uptimePct: null,
          avgBandwidth: null,
          qfScore: Math.sqrt(Math.max(total, 0)),
          trustScore: null,
        },
        update: {
          pointsEarned: total,
          qfScore: Math.sqrt(Math.max(total, 0)),
        },
      });

      // ต่อ user
      for (const g of grouped) {
        const userId = g.userId;
        const points = g._sum.amount ?? 0;

        // TODO: แทนค่านี้ด้วยสถิติจริงจาก telemetry/collector
        const uptimePct = null;
        const avgBandwidth = null;
        const qfScore = Math.sqrt(Math.max(points, 0));
        const trustScore = null;

        await prisma.metricsHourly.upsert({
          where: { hourUtc_userId_unique: { hourUtc: hourStart, userId } },
          create: {
            hourUtc: hourStart,
            userId,
            pointsEarned: points,
            uptimePct,
            avgBandwidth,
            qfScore,
            trustScore,
          },
          update: {
            pointsEarned: points,
            uptimePct,
            avgBandwidth,
            qfScore,
            trustScore,
          },
        });
      }

      // (ออปชัน) สรุปวัน: อัปเดต MetricsDaily ของวันนั้น ๆ
      const dayStart = new Date(Date.UTC(hourStart.getUTCFullYear(), hourStart.getUTCMonth(), hourStart.getUTCDate()));
      const dayEnd = new Date(dayStart.getTime() + 86_400_000);

      const sumDay = await prisma.metricsHourly.aggregate({
        _sum: { pointsEarned: true },
        where: { hourUtc: { gte: dayStart, lt: dayEnd }, userId: null },
      });

      await prisma.metricsDaily.upsert({
        where: { dayUtc_userId_unique: { dayUtc: dayStart, userId: null } },
        create: {
          dayUtc: dayStart,
          userId: null,
          pointsEarned: sumDay._sum.pointsEarned ?? 0,
        },
        update: {
          pointsEarned: sumDay._sum.pointsEarned ?? 0,
        },
      });
    },
    { connection }
  );
}

// ป้องกันถูก import โดย client bundle (ไม่มีผลเพราะเป็นไฟล์ server-only)
if (process.env.NODE_ENV === "production") {
  // ใน production เราไม่ start worker อัตโนมัติใน Vercel build
  // ให้ start ใน process ที่เหมาะสม (เช่น background worker หรือ self-host)
}
