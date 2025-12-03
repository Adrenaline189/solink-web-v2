// scripts/manual-metrics-daily.ts
import { prisma } from "@/server/db";

async function main() {
  // 👇 ใช้ user ของคุณ (ที่ใช้ใน TEST_USER_ID)
  const USER_ID = process.env.TEST_USER_ID || "cmifhixme00008iwji7nrp3vp";

  if (!USER_ID) {
    throw new Error("TEST_USER_ID env is required");
  }

  // วันนี้แบบ UTC (ตัดเวลาให้เหลือ 00:00)
  const now = new Date();
  const dayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // สมมติว่าแต้มวันนี้ = 1300 (ตาม farm-test)
  const pointsToday = 1300;

  console.log("Writing MetricsDaily for:");
  console.log("  userId  =", USER_ID);
  console.log("  dayUtc  =", dayUtc.toISOString());
  console.log("  points  =", pointsToday);

  // upsert แถว MetricsDaily ของวันนี้สำหรับ user นี้
  const row = await prisma.metricsDaily.upsert({
    where: {
      // 👇 ใช้ composite key ตามที่ Prisma บอก: dayUtc_userId_unique
      dayUtc_userId_unique: {
        dayUtc,
        userId: USER_ID,
      },
    },
    update: {
      pointsEarned: pointsToday,
      uptimePct: 0,
      avgBandwidth: 0,
      qfScore: 0,
      trustScore: 0,
    },
    create: {
      userId: USER_ID,
      dayUtc,
      pointsEarned: pointsToday,
      uptimePct: 0,
      avgBandwidth: 0,
      qfScore: 0,
      trustScore: 0,
    },
  });

  console.log("✅ upserted MetricsDaily:", row);
}

main()
  .catch((e) => {
    console.error("manual-metrics-daily error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
