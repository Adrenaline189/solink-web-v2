// server/rollup/rollup-hour.ts
import { prisma } from "@/lib/prisma";

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
 * - รวมแต้มจาก PointEvent ภายในชั่วโมงนั้น (UTC) ต่อ user
 * - upsert MetricsHourly (per user)
 * - upsert MetricsHourly ของ system (userId = "system") สำหรับกราฟ global
 *
 * NOTE:
 * - ใช้ occurredAt เป็นเวลาอีเวนต์จริง (ไม่ใช่ createdAt)
 * - unique ต้องเป็น: hourUtc_userId_unique
 */
export async function rollupHourPoints(hourInput?: Date): Promise<RollupHourResult> {
  const now = hourInput ? new Date(hourInput) : new Date();
  const hourUtc = floorToUtcHour(now);
  const nextHourUtc = new Date(hourUtc.getTime() + 60 * 60 * 1000);

  // ✅ นับแต้มที่เป็น "earn" จริง ๆ
  // ถ้าจะนับทุกอย่างให้ลบเงื่อนไข type ออก
  const EARN_TYPES = ["extension_farm", "UPTIME_MINUTE"] as const;

  const result = await prisma.$transaction(async (tx) => {
    const perUser = await tx.pointEvent.groupBy({
      by: ["userId"],
      where: {
        occurredAt: { gte: hourUtc, lt: nextHourUtc },
        type: { in: [...EARN_TYPES] },
      },
      _sum: { amount: true },
    });

    for (const u of perUser) {
      const points = u._sum.amount ?? 0;

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

    // ✅ system aggregate: ต้องเขียนทุกชั่วโมง แม้ total = 0
    const totalPoints = perUser.reduce((s, x) => s + (x._sum.amount ?? 0), 0);

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
