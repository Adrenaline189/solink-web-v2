// scripts/rollup-hourly.ts
import { Queue, Worker, QueueScheduler, JobsOptions } from "bullmq";
import Redis from "ioredis";
import { prisma } from "@/server/db"; // ปรับ path ให้ตรงโปรเจกต์

const connection = new Redis(process.env.REDIS_URL!);
const queueName = "metrics-rollup-hourly";
new QueueScheduler(queueName, { connection });

export const queue = new Queue(queueName, { connection });

export async function enqueueHourlyRollup(hourIso?: string) {
  const opts: JobsOptions = { removeOnComplete: 100, removeOnFail: 100 };
  await queue.add("rollup", { hourIso }, opts);
}

new Worker(queueName, async job => {
  const hourIso = job.data.hourIso ?? new Date(Date.now() - (Date.now()%3600000)).toISOString();
  const hourStart = new Date(hourIso);
  const hourEnd = new Date(hourStart.getTime() + 3600_000);

  // ดึง event จริงมาสรุป (ตัวอย่าง)
  const events = await prisma.pointEvent.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: hourStart, lt: hourEnd }},
    _sum: { amount: true },
  });

  for (const e of events) {
    // คำนวณ metrics จริงจากตัวเก็บสถิติ/telemetry แทนที่ค่า mock ด้านล่าง
    const uptimePct = 97.5;
    const avgBandwidth = 12.3;
    const qfScore = Math.sqrt((e._sum.amount ?? 0));
    const trustScore = 80;

    await prisma.metricsHourly.upsert({
      where: { hourUtc_userId: { hourUtc: hourStart, userId: e.userId ?? null } },
      create: {
        hourUtc: hourStart,
        userId: e.userId,
        pointsEarned: e._sum.amount ?? 0,
        uptimePct, avgBandwidth, qfScore, trustScore,
      },
      update: {
        pointsEarned: e._sum.amount ?? 0,
        uptimePct, avgBandwidth, qfScore, trustScore,
      }
    });
  }
}, { connection });
