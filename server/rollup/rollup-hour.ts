// server/rollup/rollup-hour.ts
import { prisma } from "@/lib/prisma";
import { EARN_TYPES } from "@/lib/points";

export type RollupHourResult = {
  hourUtc: Date;
  users: number;
};

// ปัดเวลาเป็นต้นชั่วโมง UTC
function floorToUtcHour(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      0,
      0,
      0
    )
  );
}

/**
 * Rollup events -> MetricsHourly
 *
 * IMPORTANT:
 * - Rollup นี้ต้องสะท้อน "EARNED points" เท่านั้น (ไม่รวมการหักแต้ม เช่น convert_debit)
 * - กันกรณีข้อมูลหลุดติดลบ: amount > 0 และ clamp ไม่ต่ำกว่า 0
 */
export async function rollupHourPoints(hourInput?: Date): Promise<RollupHourResult> {
  const now = hourInput ? new Date(hourInput) : new Date();
  const hourUtc = floorToUtcHour(now);
  const nextHourUtc = new Date(hourUtc.getTime() + 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const perUser = await tx.pointEvent.groupBy({
      by: ["userId"],
      where: {
        occurredAt: { gte: hourUtc, lt: nextHourUtc },
        type: { in: [...EARN_TYPES] },
        amount: { gt: 0 }, // ✅ กันติดลบตั้งแต่ต้นทาง
      },
      _sum: { amount: true },
    });

    for (const u of perUser) {
      const raw = u._sum.amount ?? 0;
      const points = Number.isFinite(raw) ? Math.max(0, raw) : 0;

      await tx.metricsHourly.upsert({
        where: {
          hourUtc_userId_unique: {
            hourUtc,
            userId: u.userId,
          },
        },
        update: {
          pointsEarned: points,
        },
        create: {
          hourUtc,
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

    // system aggregate: เขียนทุกชั่วโมง แม้ total = 0
    const totalRaw = perUser.reduce((s, x) => s + (x._sum.amount ?? 0), 0);
    const totalPoints = Number.isFinite(totalRaw) ? Math.max(0, totalRaw) : 0;

    await tx.metricsHourly.upsert({
      where: {
        hourUtc_userId_unique: {
          hourUtc,
          userId: "system",
        },
      },
      update: { pointsEarned: totalPoints },
      create: {
        hourUtc,
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

    return {
      hourUtc,
      users: perUser.length,
    } satisfies RollupHourResult;
  });

  return result;
}
