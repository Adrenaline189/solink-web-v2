// scripts/seed-system-metrics-today.ts
//
// Seed ตัวอย่าง MetricsHourly สำหรับ userId = "system"
// เฉพาะ "วันนี้ (UTC)" เพื่อให้กราฟ System Hourly (today) มีข้อมูลใน dev

import { prisma } from "../lib/prisma";

function startOfUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const todayStart = startOfUTC();
  console.log("Seeding MetricsHourly for `system` on", todayStart.toISOString());

  // ตัวอย่าง: สร้าง 6 ชม. แรกของวัน ด้วยแต้มสุ่ม ๆ
  const hours = [0, 1, 2, 3, 4, 5];
  const rows = hours.map((h, idx) => {
    const hourUtc = new Date(todayStart);
    hourUtc.setUTCHours(h); // 00:00, 01:00, ...

    // แต้มนิดหน่อยแบบสุ่ม ๆ ให้กราฟพอมีรูปทรง
    const base = 80 + idx * 10;
    const pointsEarned = base;

    return {
      userId: "system",
      hourUtc,
      pointsEarned,
    };
  });

  console.log("Rows to insert:", rows.length);
  rows.forEach((r) => {
    console.log(
      ` - ${r.hourUtc.toISOString()} → ${r.pointsEarned} pts`
    );
  });

  await prisma.metricsHourly.createMany({
    data: rows,
    skipDuplicates: true, // กันกรณีรันซ้ำ
  });

  console.log("✅ Done seeding MetricsHourly for today (system).");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
