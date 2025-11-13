// app/api/dashboard/summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* --------------------------- helpers --------------------------- */
function toNum(v: any): number {
  if (typeof v === "bigint") return Number(v);
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}
function startOfUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
function addDaysUTC(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/* ----------------------------- GET ----------------------------- */
export async function GET() {
  try {
    // วันนี้แบบ UTC
    const start = startOfUTC();
    const end = addDaysUTC(start, 1);

    // ✅ pointsToday: พยายามอ่านจาก MetricsDaily (system) ก่อน
    let pointsToday = 0;
    try {
      const md = await prisma.metricsDaily.findFirst({
        where: { dayUtc: start, userId: "system" },
        select: { pointsEarned: true },
      });
      pointsToday = toNum(md?.pointsEarned ?? 0);

      // สำรอง: ถ้ายังไม่มีแถวใน MetricsDaily ให้ sum จาก MetricsHourly ของวันนั้น
      if (pointsToday === 0) {
        const mh = await prisma.metricsHourly.aggregate({
          _sum: { pointsEarned: true },
          where: {
            userId: "system",
            hourUtc: { gte: start, lt: end },
          },
        });
        pointsToday = toNum(mh._sum.pointsEarned);
      }
    } catch {
      // ถ้า schema ยังไม่พร้อม ก็ให้เป็น 0 ไป
      pointsToday = 0;
    }

    // รวมยอด balance ทั้งระบบ
    const totalAgg = await prisma.pointBalance.aggregate({
      _sum: { balance: true },
    });
    const totalPoints = toNum(totalAgg._sum.balance);

    // --- QF / Trust (เดโมจากชั่วโมงล่าสุดของ system) ---
    let qf = 0;
    let trust = 0;
    try {
      const lastSystemHour = await prisma.metricsHourly.findFirst({
        where: { userId: "system", hourUtc: { gte: start, lt: end } },
        orderBy: { hourUtc: "desc" },
        select: { qfScore: true },
      });
      qf = Math.max(0, Math.min(100, Math.round(lastSystemHour?.qfScore ?? 0)));

      const nonZeroHours = await prisma.metricsHourly.count({
        where: {
          userId: "system",
          hourUtc: { gte: start, lt: end },
          pointsEarned: { gt: 0 },
        },
      });
      trust = Math.max(0, Math.min(100, nonZeroHours * 5));
    } catch {
      qf = 0;
      trust = 0;
    }

    // ค่าอื่น (placeholder)
    const slk = Number((totalPoints / 1000).toFixed(2));
    const uptimeHours = 0;
    const goalHours = 8;
    const avgBandwidthMbps = 0;

    // optional: system meta
    let region: string | null = null;
    let ip: string | null = null;
    let version: string | null = null;
    try {
      const [r, i, v] = await Promise.all([
        prisma.setting.findFirst({ where: { key: "region" } }),
        prisma.setting.findFirst({ where: { key: "ip" } }),
        prisma.setting.findFirst({ where: { key: "version" } }),
      ]);
      region = r?.value ?? null;
      ip = i?.value ?? null;
      version = v?.value ?? null;
    } catch {}

    return NextResponse.json(
      {
        pointsToday,
        totalPoints,
        slk,
        uptimeHours,
        goalHours,
        avgBandwidthMbps,
        qf,
        trust,
        region,
        ip,
        version,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "internal error" },
      { status: 500 }
    );
  }
}
