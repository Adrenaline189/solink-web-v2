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
    // ช่วงวันนี้แบบ UTC: [วันนี้ 00:00 UTC, พรุ่งนี้ 00:00 UTC)
    const start = startOfUTC();
    const end = addDaysUTC(start, 1);

    // 1) pointsToday (sum amount ของ pointEvent วันนี้ แบบ UTC)
    const todayAgg = await prisma.pointEvent.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: start, lt: end } },
    });
    const pointsToday = toNum(todayAgg._sum.amount);

    // 2) totalPoints (รวมยอด balance ทั้งระบบ)
    const totalAgg = await prisma.pointBalance.aggregate({
      _sum: { balance: true },
    });
    const totalPoints = toNum(totalAgg._sum.balance);

    // --- QF / Trust (เดโม) ---
    // QF: ใช้ qfScore ล่าสุดของ system ในวันนี้ (ถ้าไม่มีให้เป็น 0)
    let qf = 0;
    let trust = 0;

    try {
      const lastSystemHour = await prisma.metricsHourly.findFirst({
        where: { userId: "system", hourUtc: { gte: start, lt: end } },
        orderBy: { hourUtc: "desc" },
        select: { qfScore: true },
      });
      qf = Math.max(0, Math.min(100, Math.round(lastSystemHour?.qfScore ?? 0)));

      // Trust (เดโม): (#ชั่วโมงที่ system มีแต้ม > 0 วันนี้) * 5 (ค่าสูงสุด 100)
      const nonZeroHours = await prisma.metricsHourly.count({
        where: {
          userId: "system",
          hourUtc: { gte: start, lt: end },
          pointsEarned: { gt: 0 },
        },
      });
      trust = Math.max(0, Math.min(100, nonZeroHours * 5));
    } catch {
      // ถ้า schema metrics ยังไม่พร้อม ให้คงค่า 0 ไว้
      qf = 0;
      trust = 0;
    }

    // หมายเหตุ: ค่าอื่นๆ ด้านล่างยังเป็น placeholder/เดโม่
    const slk = Number((totalPoints / 1000).toFixed(2));
    const uptimeHours = 0;
    const goalHours = 8;
    const avgBandwidthMbps = 0;

    // (ตัวเลือก) system meta: ถ้ามีตาราง setting ก็อ่าน ไม่มีก็คืน null
    let region: string | null = null;
    let ip: string | null = null;
    let version: string | null = null;
    try {
      const [regionSetting, ipSetting, verSetting] = await Promise.all([
        prisma.setting.findFirst({ where: { key: "region" } }),
        prisma.setting.findFirst({ where: { key: "ip" } }),
        prisma.setting.findFirst({ where: { key: "version" } }),
      ]);
      region = regionSetting?.value ?? null;
      ip = ipSetting?.value ?? null;
      version = verSetting?.value ?? null;
    } catch {
      region = null;
      ip = null;
      version = null;
    }

    const data = {
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
    };

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "internal error" },
      { status: 500 },
    );
  }
}
