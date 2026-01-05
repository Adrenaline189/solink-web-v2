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

/**
 * Rollup events -> MetricsDaily
 *
 * IMPORTANT:
 * - นับเฉพาะ EARNED points เท่านั้น
 * - กันติดลบ: amount > 0 และ clamp ไม่ต่ำกว่า 0
 */
export async function rollupDay(dayInput?: Date): Promise<RollupDayResult> {
  const now = dayInput ? new Date(dayInput) : new Date();
  const dayUtc = floorToUtcDay(now);
  const nextDayUtc = new Date(dayUtc.getTime() + 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const perUser = await tx.pointEvent.groupBy({
      by: ["userId"],
      where: {
        occurredAt: { gte: dayUtc, lt: nextDayUtc },
        type: { in: [...EARN_TYPES] },
        amount: { gt: 0 }, // ✅ กันติดลบ
      },
      _sum: { amount: true },
    });

    for (const u of perUser) {
      const raw = u._sum.amount ?? 0;
      const points = Number.isFinite(raw) ? Math.max(0, raw) : 0;

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

    const totalRaw = perUser.reduce((s, x) => s + (x._sum.amount ?? 0), 0);
    const totalPoints = Number.isFinite(totalRaw) ? Math.max(0, totalRaw) : 0;

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
