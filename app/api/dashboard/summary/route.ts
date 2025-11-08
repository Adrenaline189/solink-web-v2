import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
}

export async function GET() {
  try {
    // wallet (optional) – ถ้ามี cookie/headers อาจ map เป็น user ได้
    // ในตัวอย่างนี้สรุปรวมทั้งระบบก่อน
    const today0 = startOfTodayUTC();

    // points today
    const eventsToday = await prisma.pointEvent.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: today0 } },
    });
    const pointsToday = eventsToday._sum.amount ?? 0;

    // total points (sum of all balances)
    const totalBal = await prisma.pointBalance.aggregate({
      _sum: { balance: true },
    });
    const totalPoints = totalBal._sum.balance ?? 0;

    // demo values for other fields (plug your real sources when ready)
    const slk = +(totalPoints / 1000).toFixed(2);
    const uptimeHours = 0;
    const goalHours = 8;
    const avgBandwidthMbps = 0;
    const qf = 0;
    const trust = 0;

    // from Setting (optional)
    const regionSetting = await prisma.setting.findFirst({ where: { key: "region" } });
    const ipSetting = await prisma.setting.findFirst({ where: { key: "ip" } });
    const verSetting = await prisma.setting.findFirst({ where: { key: "version" } });

    const data = {
      pointsToday,
      totalPoints,
      slk,
      uptimeHours,
      goalHours,
      avgBandwidthMbps,
      qf,
      trust,
      region: regionSetting?.value ?? null,
      ip: ipSetting?.value ?? null,
      version: verSetting?.value ?? null,
    };

    return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "internal error" }, { status: 500 });
  }
}
