// scripts/manual-rollup-hourly.ts
import "dotenv/config";
import { prisma } from "@/server/db";

// ให้ใช้ user 'system' เป็น GLOBAL SUMMARY (ต้องมีอยู่แล้วในตาราง User)
const GLOBAL_USER_ID = process.env.METRICS_GLOBAL_USER_ID ?? "system";

function parseHourIso(): Date {
  const arg = process.env.HOUR_ISO || process.argv[2];

  if (!arg) {
    console.error(
      'Usage: HOUR_ISO="2025-11-27T03:00:00Z" tsx scripts/manual-rollup-hourly.ts'
    );
    process.exit(1);
  }

  const d = new Date(arg);
  if (Number.isNaN(d.getTime())) {
    console.error("❌ Invalid HOUR_ISO:", arg);
    process.exit(1);
  }

  // normalize to top-of-hour UTC
  d.setUTCMinutes(0, 0, 0);
  return d;
}

async function main() {
  const hourStart = parseHourIso();
  const hourEnd = new Date(hourStart.getTime() + 3600_000);

  console.log("⏱ Hour window (UTC):");
  console.log("  from =", hourStart.toISOString());
  console.log("  to   =", hourEnd.toISOString());

  // 1) รวมแต้มตาม PointEvent ภายในชั่วโมงนี้
  const grouped = await prisma.pointEvent.groupBy({
    by: ["userId"],
    where: {
      createdAt: { gte: hourStart, lt: hourEnd },
    },
    _sum: { amount: true },
  });

  if (!grouped.length) {
    console.log("ℹ️ No pointEvent rows in this hour.");
  } else {
    console.log(`📊 Found ${grouped.length} user(s) in this hour:`);
    for (const g of grouped) {
      console.log("  userId =", g.userId, "points =", g._sum.amount ?? 0);
    }
  }

  const total = grouped.reduce((s, g) => s + (g._sum.amount ?? 0), 0);

  // 2) แถวสรุปทั้งระบบ userId = GLOBAL_USER_ID
  const globalRow = await prisma.metricsHourly.upsert({
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

  console.log("✅ Upserted GLOBAL metricsHourly:", globalRow);

  // 3) แถวต่อ user แต่ละคน
  for (const g of grouped) {
    const userId = g.userId;
    const points = g._sum.amount ?? 0;

    const row = await prisma.metricsHourly.upsert({
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

    console.log("✅ Upserted USER metricsHourly:", row.id, "userId =", userId);
  }

  // 4) Rollup รายวัน (GLOBAL เท่านั้น)
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

  const dailyRow = await prisma.metricsDaily.upsert({
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

  console.log("✅ Upserted GLOBAL metricsDaily:", dailyRow);

  console.log("🎉 Done manual hourly rollup.");
}

main().catch((err) => {
  console.error("manual-rollup-hourly error:", err);
  process.exit(1);
});
