// app/api/referral/bonus/route.ts
// Give 100 pts signup bonus to referrer when new user signs up with a referral code
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
    const { referralCode } = body as { referralCode?: string };

    if (!referralCode) {
      return NextResponse.json({ ok: false, error: "Missing referralCode" }, { status: 400 });
    }

    // Look up referral code = first 8 chars of wallet address
    const referrerWallet = await prisma.$queryRawUnsafe<Array<{ id: string; wallet: string }>>(
      `SELECT id, wallet FROM "User" WHERE UPPER(LEFT(wallet, 8)) = UPPER($1) LIMIT 1`,
      [referralCode]
    );

    if (!referrerWallet || referrerWallet.length === 0) {
      return NextResponse.json({ ok: false, error: "Invalid referral code" }, { status: 400 });
    }

    const referrerUserId = referrerWallet[0].id;
    const newUser = await prisma.user.findFirst({
      where: { wallet: ctx.wallet },
      select: { id: true },
    });

    if (!newUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Check if user already got referred (avoid double bonus)
    const existingBonus = await prisma.pointEvent.findFirst({
      where: {
        userId: referrerUserId,
        type: "referral_bonus",
        meta: { path: ["referredUser"], equals: ctx.wallet },
      },
    });

    if (existingBonus) {
      return NextResponse.json({ ok: false, error: "Already referred" }, { status: 400 });
    }

    const BONUS_SIGNUP = 100;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.pointEvent.create({
        data: {
          userId: referrerUserId,
          nodeId: null,
          type: "referral_bonus",
          amount: BONUS_SIGNUP,
          meta: {
            source: "referral/signup",
            referredUser: ctx.wallet,
            referredUserId: newUser.id,
            bonusType: "signup",
            ruleVersion: "v1",
          },
          source: "referral",
          ruleVersion: "v1",
          dedupeKey: `referral:signup:${referrerUserId}:${ctx.wallet}`,
          nonce: crypto.randomUUID(),
          signatureOk: true,
          riskScore: 0,
          occurredAt: now,
        },
      });

      await tx.pointBalance.upsert({
        where: { userId: referrerUserId },
        update: { balance: { increment: BONUS_SIGNUP } },
        create: { userId: referrerUserId, balance: BONUS_SIGNUP, slk: 0 },
      });
    });

    return NextResponse.json({ ok: true, bonus: BONUS_SIGNUP, referrer: referralCode.slice(0, 8) });
  } catch (e: any) {
    console.error("[referral/bonus]", e.message);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
