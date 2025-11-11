// scripts/rollup-hourly.ts
// BullMQ v5: ไม่มี QueueScheduler แล้ว ใช้ Queue + Worker (+QueueEvents ถ้าต้องฟังอีเวนต์)
// หมายเหตุ: Vercel ไม่เหมาะรัน worker ต่อเนื่อง ให้รัน worker แยกใน background service

import { Queue, Worker, QueueEvents, type JobsOptions } from "bullmq";
import { prisma } from "@/server/db";
import { getRedis } from "@/lib/redis";

const connection = getRedis() as any; // bullmq v5 ยังรองรับการส่ง IORedis instance

const queueName = "metrics-rollup-hourly";
export const queue = new Queue(queueName, { connection });
const queueEvents = new QueueEvents(queueName, { connection }); // optional listener (ไม่จำเป็นต่อการทำงานหลัก)

// enqueue งานสรุปรายชั่วโมง (optional hourIso = ISO string ของชั่วโมงที่ต้องการ rollup)
export async function enqueueHourlyRollup(hourIso?: string) {
  const opts: JobsOptions = {
    removeOnComplete: 200,
    removeOnFail: 100,
  };
  await queue.add("rollup", { hourIso }, opts);
}

// worker สำหรับประมวลผล rollup (อย่ารันบน Vercel)
// ให้ใช้งานใน service/worker แยก เช่น Railway/Fly/Render
export function startHourlyWorker() {
  return new Worker(
    queueName,
    async (job) => {
      // กำหนดช่วงชั่วโมง (UTC) ที่จะรวมสถิติ
      const hourIso =
        job.data.hourIso ??
        new Date(Date.now() - (Date.now() % 3600000)).toISOString(); // floor เป็นต้นชั่วโมง
      const hourStart = new Date(hourIso);
      hourStart.setUTCMinutes(0, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 3600_000);

      // รวมแต้มราย user ในช่วงชั่วโมง
      const grouped = await prisma.pointEvent.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: hourStart, lt: hourEnd } },
        _sum: { amount: true },
      });

      const total = grouped.reduce((s, g) => s + (g._sum.amount ?? 0), 0);

      // สรุปภาพรวมทั้งระบบ (userId = null)
      await prisma.metricsHourly.upsert({
        where: { hourUtc_userId_unique: { hourUtc: hourStart, userId: "GLOBAL" } },
        create: {
          hourUtc: hourStart,
          userId: "GLOBAL",
          pointsEarned: total,
          qfScore: Math.sqrt(Math.max(total, 0)),
        },
        update: {
          pointsEarned: total,
          qfScore: Math.sqrt(Math.max(total, 0)),
        },
      });

      // สรุปต่อ user
      for (const g of grouped) {
        const userId = g.userId;
        const points = g._sum.amount ?? 0;
        await prisma.metricsHourly.upsert({
          where: { hourUtc_userId_unique: { hourUtc: hourStart, userId } },
          create: {
            hourUtc: hourStart,
            userId,
            pointsEarned: points,
            qfScore: Math.sqrt(Math.max(points, 0)),
          },
          update: {
            pointsEarned: points,
            qfScore: Math.sqrt(Math.max(points, 0)),
          },
        });
      }

      // rollup รายวันจาก metricsHourly → metricsDaily
      const dayStart = new Date(
        Date.UTC(
          hourStart.getUTCFullYear(),
          hourStart.getUTCMonth(),
          hourStart.getUTCDate()
        )
      );
      const dayEnd = new Date(dayStart.getTime() + 86_400_000);

      const sumDay = await prisma.metricsHourly.aggregate({
        _sum: { pointsEarned: true },
        where: { hourUtc: { gte: dayStart, lt: dayEnd }, userId: "GLOBAL" },
      });

      await prisma.metricsDaily.upsert({
        where: { dayUtc_userId_unique: { dayUtc: dayStart, userId: "GLOBAL" } },
        create: {
          dayUtc: dayStart,
          userId: "GLOBAL",
          pointsEarned: sumDay._sum.pointsEarned ?? 0,
        },
        update: {
          pointsEarned: sumDay._sum.pointsEarned ?? 0,
        },
      });

      return { hour: hourStart.toISOString(), total };
    },
    { connection }
  );
}
