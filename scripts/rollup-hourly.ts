// scripts/rollup-hourly.ts
// BullMQ v5: ใช้ Queue + Worker (ไม่มี QueueScheduler)
// หมายเหตุ: รัน Worker ใน service แยก (ไม่ใช่ Vercel)

import { Queue, Worker, QueueEvents, type JobsOptions } from "bullmq";
import { getRedis } from "@/lib/redis";
import { prisma } from "@/server/db";

// ---- กำหนด USER สำหรับแถวสรุปทั้งระบบ (ต้องมีอยู่จริงในตาราง User) ----
const GLOBAL_USER_ID = process.env.METRICS_GLOBAL_USER_ID ?? "system";

// ---- Queue / Connection ----
const connection = getRedis() as any; // bullmq v5 รองรับ ioredis instance
const queueName = "metrics-rollup-hourly";

export const queue = new Queue(queueName, { connection });
export const queueEvents = new QueueEvents(queueName, { connection }); // optional

/**
 * enqueue งานสรุปรายชั่วโมง
 */
export async function enqueueHourlyRollup(hourIso?: string) {
  const opts: JobsOptions = {
    removeOnComplete: 200,
    removeOnFail: 100,
  };

  // ถ้า hourIso เป็น "auto" หรือ undefined → ไม่ต้องส่งเข้า job
  const payload =
    !hourIso || hourIso === "auto" ? {} : { hourIso };

  await queue.add("rollup", payload, opts);
}

/**
 * สตาร์ท Worker (รันใน background service เท่านั้น)
 */
export function startHourlyWorker() {
  return new Worker(
    queueName,
    async (job) => {
      // ---- คำนวณช่วงชั่วโมง (UTC) ----
      const rawHourIso = (job?.data?.hourIso as string | undefined) ?? undefined;

      let baseIso: string;
      if (!rawHourIso || rawHourIso === "auto") {
        // ใช้เวลาปัจจุบัน ปัดลงเป็นต้นชั่วโมง
        const now = Date.now();
        const floored = now - (now % 3600000);
        baseIso = new Date(floored).toISOString();
      } else {
        baseIso = rawHourIso;
      }

      const hourStart = new Date(baseIso);
      if (isNaN(hourStart.getTime())) {
        throw new Error(`Invalid hourIso received: ${baseIso}`);
      }

      hourStart.setUTCMinutes(0, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 3600_000);

      // ---- รวมแต้มราย user ภายในชั่วโมง ----
      const grouped = await prisma.pointEvent.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: hourStart, lt: hourEnd } },
        _sum: { amount: true },
      });

      const total = grouped.reduce((s, g) => s + (g._sum.amount ?? 0), 0);

      // ---- แถวสรุปทั้งระบบ: ใช้ userId = GLOBAL_USER_ID (ไม่ใช้ null) ----
      await prisma.metricsHourly.upsert({
        where: {
          hourUtc_userId_unique: {
            hourUtc: hourStart,
            userId: GLOBAL_USER_ID,
          },
        },
        create: {
          hourUtc: hourStart,
          userId: GLOBAL_USER_ID,
          pointsEarned: total,
          qfScore: Math.sqrt(Math.max(total, 0)),
        },
        update: {
          pointsEarned: total,
          qfScore: Math.sqrt(Math.max(total, 0)),
        },
      });

      // ---- แถวต่อผู้ใช้ ----
      for (const g of grouped) {
        const userId = g.userId; // string
        const points = g._sum.amount ?? 0;

        await prisma.metricsHourly.upsert({
          where: {
            hourUtc_userId_unique: {
              hourUtc: hourStart,
              userId,
            },
          },
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

      // ---- rollup รายวัน (GLOBAL เท่านั้น) ----
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
        where: {
          hourUtc: { gte: dayStart, lt: dayEnd },
          userId: GLOBAL_USER_ID,
        },
      });

      await prisma.metricsDaily.upsert({
        where: {
          dayUtc_userId_unique: {
            dayUtc: dayStart,
            userId: GLOBAL_USER_ID,
          },
        },
        create: {
          dayUtc: dayStart,
          userId: GLOBAL_USER_ID,
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
