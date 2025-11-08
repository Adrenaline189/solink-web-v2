// app/api/dashboard/summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function todayRangeUTC() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet")?.trim();
  if (!wallet) {
    return NextResponse.json({ ok: false, error: "wallet required" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ where: { wallet } });
  if (!user) {
    return NextResponse.json({
      ok: true,
      data: {
        pointsToday: 0,
        totalPoints: 0,
        slk: 0,
        uptimeHours: 0,
        goalHours: 8,
        avgBandwidthMbps: 0,
        qf: 0,
        trust: 0,
        region: null,
        ip: null,
        version: null,
      },
    });
  }

  const { start, end } = todayRangeUTC();

  // แต้มวันนี้
  const today = await prisma.pointEvent.aggregate({
    where: { userId: user.id, createdAt: { gte: start, lte: end } },
    _sum: { amount: true },
  });
  const pointsToday = today._sum.amount ?? 0;

  // แต้มรวม: ใช้ PointBalance ถ้ามี ไม่งั้น fallback รวมจาก PointEvent
  const balance = await prisma.pointBalance.findUnique({ where: { userId: user.id } });
  let totalPoints = balance?.balance ?? null;
  if (totalPoints == null) {
    const agg = await prisma.pointEvent.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    });
    totalPoints = agg._sum.amount ?? 0;
  }

  // ชั่วโมงที่มี event วันนี้ (แทน uptime อย่างง่าย)
  const hoursRows: Array<{ h: Date }> = await prisma.$queryRaw`
    SELECT date_trunc('hour', "createdAt") as h
    FROM "PointEvent"
    WHERE "userId" = ${user.id} AND "createdAt" BETWEEN ${start} AND ${end}
    GROUP BY 1
  `;
  const uptimeHours = hoursRows.length;

  // อ่าน region/ip/version แบบ best-effort จาก Setting (หรือเก็บลง Setting ในอนาคต)
  const settings = await prisma.setting.findMany({
    where: { userId: user.id, key: { in: ["region", "ip", "version"] } },
    select: { key: true, value: true },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return NextResponse.json({
    ok: true,
    data: {
      pointsToday,
      totalPoints,
      slk: Math.round((totalPoints / 1000) * 100) / 100, // ตัวอย่าง conversion: 1000 pts = 1 SLK
      uptimeHours,
      goalHours: 8,
      avgBandwidthMbps: 0, // ถ้ายังไม่มีที่มา ให้คง 0 ไว้ก่อน
      qf: 0,                // idem
      trust: 0,             // idem
      region: map.region ?? null,
      ip: map.ip ?? null,
      version: map.version ?? null,
    },
  });
}
