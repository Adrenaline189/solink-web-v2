// scripts/seed-metrics-today.cjs
// Seed ข้อมูล MetricsDaily + MetricsHourly สำหรับ userId = "system" ของ "วันนี้ (UTC)"

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function startOfUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const start = startOfUTC(); // วันนี้ 00:00:00 UTC

  console.log("Seeding metrics for dayUtc =", start.toISOString());

  // ลบข้อมูลเก่าของวันนี้ (ถ้ามี) ก่อน เพื่อกัน error duplicate
  await prisma.metricsHourly.deleteMany({
    where: {
      userId: "system",
      hourUtc: {
        gte: start,
        lt: new Date(start.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });

  await prisma.metricsDaily.deleteMany({
    where: {
      userId: "system",
      dayUtc: start,
    },
  });

  // สร้าง hourly 24 ชั่วโมง (หรือจะเหลือ 12 ก็ได้)
  const hours = [];
  for (let h = 0; h < 24; h++) {
    const d = new Date(start);
    d.setUTCHours(h, 0, 0, 0);

    // จำลองแต้ม (ให้บางช่วงเยอะ บางช่วงน้อย)
    let points = 0;
    if (h >= 8 && h <= 23) {
      // ช่วงใช้งานเยอะหน่อย
      points = 50 + Math.round(Math.random() * 100);
    }

    hours.push({ hourUtc: d, pointsEarned: points });
  }

  // insert ลง MetricsHourly
  await prisma.metricsHourly.createMany({
    data: hours.map((h) => ({
      userId: "system",
      hourUtc: h.hourUtc,
      pointsEarned: h.pointsEarned,
      qfScore: 80 + Math.round(Math.random() * 10), // 80–90
      trustScore: 85 + Math.round(Math.random() * 10), // 85–95
    })),
  });

  const totalPoints = hours.reduce((sum, h) => sum + h.pointsEarned, 0);
  const activeHours = hours.filter((h) => h.pointsEarned > 0).length;
  const uptimePct = activeHours > 0 ? (activeHours / 24) * 100 : 0;

  console.log("Total system points today:", totalPoints);
  console.log("Active hours:", activeHours, "=> uptimePct =", uptimePct.toFixed(1));

  // insert ลง MetricsDaily
  await prisma.metricsDaily.create({
    data: {
      userId: "system",
      dayUtc: start,
      pointsEarned: totalPoints,
      uptimePct,
      avgBandwidth: 40 + Math.random() * 20, // จำลอง 40–60 Mbps
      qfScore: 88,
      trustScore: 92,
    },
  });

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
