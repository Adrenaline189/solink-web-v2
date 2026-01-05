// app/api/dashboard/realtime/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

// ✅ Earn types only
const EARN_TYPES = ["extension_farm", "UPTIME_MINUTE", "referral", "referral_bonus"] as const;

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext(req);
    if (!ctx?.wallet) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({ where: { wallet: ctx.wallet } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const dayStart = startOfUtcDay(now);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    // 1) earned today (live) from PointEvent (earn only)
    const earnedAgg = await prisma.pointEvent.aggregate({
      where: {
        userId: user.id,
        occurredAt: { gte: dayStart, lt: dayEnd },
        type: { in: [...EARN_TYPES] },
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    });

    const earnedTodayRaw = earnedAgg._sum.amount ?? 0;
    const earnedToday = Number.isFinite(earnedTodayRaw) ? Math.max(0, earnedTodayRaw) : 0;

    // 2) rolled today from MetricsDaily (if exists)
    const rolledRow = await prisma.metricsDaily.findFirst({
      where: { userId: user.id, dayUtc: dayStart },
      select: { pointsEarned: true },
    });

    const rolledRaw = rolledRow?.pointsEarned ?? 0;
    const rolledPoints = Number.isFinite(rolledRaw) ? Math.max(0, rolledRaw) : 0;

    // 3) livePoints = earned - rolled (clamp)
    const livePoints = Math.max(0, earnedToday - rolledPoints);

    // 4) pointsToday = rolled + live
    const pointsToday = rolledPoints + livePoints;

    return NextResponse.json({
      ok: true,
      wallet: ctx.wallet,
      userId: user.id,
      dayUtc: dayStart.toISOString(),
      pointsToday,
      livePoints,
      rolledPoints,
    });
  } catch (e: any) {
    console.error("realtime error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal error" },
      { status: 500 }
    );
  }
}
