"use server";

import { prisma } from "@/lib/prisma";

function hourStartUTC(d: Date) {
  const x = new Date(d);
  x.setUTCMinutes(0, 0, 0);
  return x;
}
function addHours(d: Date, h: number) {
  const x = new Date(d);
  x.setUTCHours(x.getUTCHours() + h);
  return x;
}

const EARN_TYPES = [
  "UPTIME_MINUTE",
  "VERIFIER_BW",
  "REFERRAL",
  "BONUS",
] as const;

// พวกนี้เป็น “หักแต้ม” → ไม่ต้องเอามารวมเป็น pointsEarned (หรือถ้าคุณอยากให้เป็น net ก็รวมไปเลยได้)
const DEBIT_TYPES = ["PENALTY", "CONVERT_DEBIT"] as const;

export async function rollupHourPoints(hourUtc: Date) {
  const start = hourStartUTC(hourUtc);
  const end = addHours(start, 1);

  // รวมคะแนนจาก PointEvent ในช่วงชั่วโมงนั้น (อิง occurredAt)
  const agg = await prisma.pointEvent.groupBy({
    by: ["userId"],
    where: {
      occurredAt: { gte: start, lt: end },
      type: { in: [...EARN_TYPES] }, // <<<< จุดที่ “ผูก sharing events” แบบชัดเจน
      // ถ้า sharing ใช้ type อื่น เช่น "SHARING_AWARD" ให้ใส่เพิ่มใน EARN_TYPES
    },
    _sum: { amount: true },
  });

  // upsert เข้า MetricsHourly โดย “อัปเดตแค่ pointsEarned”
  for (const row of agg) {
    const userId = row.userId;
    const points = row._sum.amount ?? 0;

    await prisma.metricsHourly.upsert({
      where: {
        hourUtc_userId_unique: { hourUtc: start, userId }, // <<<< ชื่อ unique ของคุณ
      },
      create: {
        hourUtc: start,
        userId,
        pointsEarned: points,
      },
      update: {
        pointsEarned: points,
        // ไม่แตะ uptimePct/avgBandwidth/qf/trust เพื่อไม่ชนกับ rollup node-flow เดิม
      },
    });
  }

  return { hourUtc: start.toISOString(), users: agg.length };
}
