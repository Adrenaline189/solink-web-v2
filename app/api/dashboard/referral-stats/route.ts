import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

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

    // Count of referral bonuses (เฉพาะ type = referral_bonus)
    const bonusTotalAgg = await prisma.pointEvent.aggregate({
      where: { userId: user.id, type: "referral_bonus" },
      _sum: { amount: true },
    });

    const bonusAllTime = Math.max(0, Number(bonusTotalAgg._sum.amount ?? 0));

    // Bonus วันนี้
    const bonusTodayAgg = await prisma.pointEvent.aggregate({
      where: {
        userId: user.id,
        type: "referral_bonus",
        occurredAt: { gte: dayStart, lt: dayEnd },
      },
      _sum: { amount: true },
    });

    const bonusToday = Math.max(0, Number(bonusTodayAgg._sum.amount ?? 0));

    // Count referrals (users ที่ถูก refer โดย user นี้)
    // ถ้ายังไม่มี referredBy field → fallback: นับจาก referral events
    // ปัจจุบันใช้วิธีนับจาก PointEvent type=referral
    const referralCountAgg = await prisma.pointEvent.aggregate({
      where: { userId: user.id, type: "referral" },
      _select: { _count: { select: { id: true } } },
    });

    const referredCount = referralCountAgg._count.id;

    // Referral code = wallet address (shortened)
    const referralCode = ctx.wallet.slice(0, 8).toUpperCase();
    const referralUrl = `https://solink.network/?ref=${referralCode}`;

    // Weekly bonus
    const weekStart = new Date(dayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const bonusWeekAgg = await prisma.pointEvent.aggregate({
      where: {
        userId: user.id,
        type: "referral_bonus",
        occurredAt: { gte: weekStart, lt: dayEnd },
      },
      _sum: { amount: true },
    });

    const bonusThisWeek = Math.max(0, Number(bonusWeekAgg._sum.amount ?? 0));

    return NextResponse.json({
      ok: true,
      referralCode,
      referralUrl,
      referredCount,
      bonusToday,
      bonusThisWeek,
      bonusAllTime,
    });
  } catch (e: any) {
    console.error("[dashboard/referral-stats] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Internal error" }, { status: 500 });
  }
}
