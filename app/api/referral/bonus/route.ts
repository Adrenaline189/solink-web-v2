// app/api/referral/bonus/route.ts
// Called after a new user signs up with a referral code → give referrer 100 pts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext(req);
    if (!ctx?.wallet) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { referredByWallet } = body as { referredByWallet?: string };

    if (!referredByWallet) {
      return NextResponse.json({ ok: false, error: "Missing referredByWallet" }, { status: 400 });
    }

    // Find referrer user
    const referrer = await prisma.user.findFirst({
      where: { wallet: referredByWallet },
      select: { id: true, wallet: true },
    });

    if (!referrer) {
      return NextResponse.json({ ok: false, error: "Referrer not found" }, { status: 404 });
    }

    // Check if this user already has a referrer (prevent double bonus)
    const currentUser = await prisma.user.findFirst({
      where: { wallet: ctx.wallet },
      select: { id: true, referredBy: true },
    });

    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    if (currentUser.referredBy) {
      return NextResponse.json({ ok: false, error: "Already referred" }, { status: 400 });
    }

    // Update user's referredBy field
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { referredBy: referredByWallet },
    });

    // Give referrer 100 pts bonus
    const BONUS_SIGNUP = 100;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // Create bonus event
      await tx.pointEvent.create({
        data: {
          userId: referrer.id,
          nodeId: null,
          type: "referral_bonus",
          amount: BONUS_SIGNUP,
          meta: {
            source: "referral/signup",
            referredUser: ctx.wallet,
            bonusType: "signup",
            ruleVersion: "v1",
          },
          source: "referral",
          ruleVersion: "v1",
          dedupeKey: `referral:signup:${referrer.id}:${ctx.wallet}:${now.toISOString()}`,
          nonce: crypto.randomUUID(),
          signatureOk: true,
          riskScore: 0,
          occurredAt: now,
        },
      });

      // Update referrer balance
      await tx.pointBalance.upsert({
        where: { userId: referrer.id },
        update: { balance: { increment: BONUS_SIGNUP } },
        create: { userId: referrer.id, balance: BONUS_SIGNUP, slk: 0 },
      });
    });

    return NextResponse.json({
      ok: true,
      bonus: BONUS_SIGNUP,
      referrer: referredByWallet.slice(0, 8),
    });
  } catch (e: any) {
    console.error("[referral/bonus]", e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
