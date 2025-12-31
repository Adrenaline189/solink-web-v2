// server/rollup/rollup-day.ts
import { prisma } from "@/lib/prisma";

export type RollupDayResult = {
  dayUtc: Date;
  users: number; // จำนวน user ที่มี event ในวันนั้น
};

// ปัดเวลาเป็นต้นวัน UTC
function floorToUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Rollup events -> MetricsDaily
 *
 * - รวมแต้มจาก PointEvent ภายในวันนั้น (UTC) ต่อ user
 * - upsert MetricsDaily (per user)
 * - upsert MetricsDaily ของ system (userId = "system") สำหรับกราฟ global (/api/dashboard/system-daily)
 *
 * IMPORTANT:
 * - ใช้ occurredAt เป็นเวลาอีเวนต์จริง (ไม่ใช่ createdAt)
 * - ใช้ composite unique key: dayUtc_userId_unique
 */
export async function rollupDay(dayInput?: Date): Promise<RollupDayResult> {
  const now = dayInput ? new Date(dayInput) : new Date();
  const dayUtc = floorToUtcDay(now);
  const nextDayUtc = new Date(dayUtc.getTime() + 24 * 60 * 60 * 1000);

  // เลือกประเภทที่นับเป็น "แต้มที่ earn" สำหรับ daily
  const EARN_TYPES = ["extension_farm", "UPTIME_MINUTE"] as const;

  const result = await prisma.$transaction(async (tx) => {
    // 1) รวมแต้มต่อ user ในวันนั้น
    const perUser = await tx.pointEvent.groupBy({
      by: ["userId"],
      where: {
        occurredAt: { gte: dayUtc, lt: nextDayUtc },
        type: { in: [...EARN_TYPES] },
      },
      _sum: { amount: true },
    });

    // 2) upsert MetricsDaily (per user)
    for (const u of perUser) {
      const points = u._sum.amount ?? 0;

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

    // 3) System aggregate (userId = "system")
    const totalPoints = perUser.reduce((s, x) => s + (x._sum.amount ?? 0), 0);

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
