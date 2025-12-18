"use server";

import { prisma } from "@/lib/prisma";

function dayStartUTC(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

export async function rollupDay(dayUtc: Date) {
  const start = dayStartUTC(dayUtc);
  const end = addDays(start, 1);

  const agg = await prisma.metricsHourly.groupBy({
    by: ["userId"],
    where: {
      hourUtc: { gte: start, lt: end },
      userId: { not: null },
    },
    _sum: { pointsEarned: true },
    _avg: { uptimePct: true, avgBandwidth: true, qfScore: true, trustScore: true },
  });

  for (const row of agg) {
    const userId = row.userId!;
    await prisma.metricsDaily.upsert({
      where: { dayUtc_userId_unique: { dayUtc: start, userId } }, // <<<< unique ของคุณ
      create: {
        dayUtc: start,
        userId,
        pointsEarned: row._sum.pointsEarned ?? 0,
        uptimePct: row._avg.uptimePct ?? null,
        avgBandwidth: row._avg.avgBandwidth ?? null,
        qfScore: row._avg.qfScore ?? null,
        trustScore: row._avg.trustScore ?? null,
      },
      update: {
        pointsEarned: row._sum.pointsEarned ?? 0,
        uptimePct: row._avg.uptimePct ?? null,
        avgBandwidth: row._avg.avgBandwidth ?? null,
        qfScore: row._avg.qfScore ?? null,
        trustScore: row._avg.trustScore ?? null,
      },
    });
  }

  return { dayUtc: start.toISOString(), users: agg.length };
}
