// server/rollup/rollup-day.ts
import { prisma } from "@/lib/prisma";
import { EARN_TYPES } from "@/lib/points";

export type RollupDayResult = {
  dayUtc: Date;
  users: number;
};

function floorToUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function addUtcDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function clampNonNegativeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  // amount เป็น integer อยู่แล้ว แต่กันกรณี driver คืน bigint/string
  return Math.max(0, Math.trunc(n));
}

/**
 * Rollup events -> MetricsDaily (UTC day bucket)
 *
 * IMPORTANT:
 * - นับเฉพาะ EARNED points เท่านั้น (type in EARN_TYPES)
 * - กันติดลบ: amount > 0 และ clamp ไม่ต่ำกว่า 0
 * - ใช้ occurredAt (เวลาที่แต้มเกิดจริง) ไม่ใช้ createdAt
 *
 * Notes:
 * - upsert ต่อ userId ต่อวัน (dayUtc)
 * - เขียน "system" เป็นผลรวมของทุก user ในวันนั้น
 */
export async function rollupDay(dayInput?: Date): Promise<RollupDayResult> {
  const now = dayInput ? new Date(dayInput) : new Date();
  const dayUtc = floorToUtcDay(now);
  const nextDayUtc = addUtcDays(dayUtc, 1);

  const result = await prisma.$transaction(async (tx) => {
    // 1) รวมแต้มต่อ user (เฉพาะ earned และ amount > 0)
    const perUser = await tx.pointEvent.groupBy({
      by: ["userId"],
      where: {
        occurredAt: { gte: dayUtc, lt: nextDayUtc },
        type: { in: [...EARN_TYPES] },
        amount: { gt: 0 },
        // ถ้าต้องกัน system หลุดมาจาก event (เผื่อมี) ให้เปิดบรรทัดนี้
        // userId: { not: "system" },
      },
      _sum: { amount: true },
    });

    // 2) เขียน MetricsDaily ต่อ user
    for (const u of perUser) {
      const points = clampNonNegativeInt(u._sum.amount);

      await tx.metricsDaily.upsert({
        where: {
          dayUtc_userId_unique: {
            dayUtc,
            userId: u.userId,
          },
        },
        update: {
          pointsEarned: points,
        },
        create: {
          dayUtc,
          userId: u.userId,
          pointsEarned: points,
          uptimePct: null,
          avgBandwidth: null,
          qfScore: null,
          trustScore: null,
          region: null,
          version: null,
        },
      });
    }

    // 3) เขียน MetricsDaily ของ system (รวมทุก user)
    const totalPoints = clampNonNegativeInt(
      perUser.reduce<number>((s, x) => s + (typeof x._sum.amount === "number" ? x._sum.amount : Number(x._sum.amount ?? 0)), 0)
    );

    await tx.metricsDaily.upsert({
      where: {
        dayUtc_userId_unique: {
          dayUtc,
          userId: "system",
        },
      },
      update: {
        pointsEarned: totalPoints,
      },
      create: {
        dayUtc,
        userId: "system",
        pointsEarned: totalPoints,
        uptimePct: null,
        avgBandwidth: null,
        qfScore: null,
        trustScore: null,
        region: null,
        version: null,
      },
    });

    return { dayUtc, users: perUser.length } satisfies RollupDayResult;
  });

  return result;
}
