// app/api/points/earn/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/auth";
import { POLICY, DAILY_CAP, type EarnType } from "@/lib/policy";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

type Body = {
  wallet: string;
  type: EarnType;
  amount?: number;
  meta?: Record<string, any>;
  nonce?: string; // idempotency guard from client
};

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: NextRequest) {
  try {
    requireApiKey(req);
    rateLimit(req.ip ?? "unknown", Number(process.env.RATE_LIMIT_PER_MIN ?? 30));

    const body = (await req.json()) as Body;
    if (!body?.wallet) return bad("wallet required");
    if (!body?.type) return bad("type required");

    const policy = POLICY[body.type];
    if (!policy) return bad("unsupported type");

    const amount = Math.max(0, Math.min(policy.maxPerEvent, Number(body.amount ?? 0)));
    if (!amount) return bad("amount must be > 0");

    const user = await prisma.user.upsert({
      where: { wallet: body.wallet },
      update: {},
      create: { wallet: body.wallet },
    });

    // idempotency by client nonce (optional)
    if (body.nonce) {
      const dup = await prisma.pointEvent.findFirst({
        where: { userId: user.id, nonce: body.nonce },
        select: { id: true },
      });
      if (dup) return NextResponse.json({ ok: true, duplicate: true, eventId: dup.id });
    }

    // daily cap (UTC day)
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    const agg = await prisma.pointEvent.aggregate({
      where: { userId: user.id, occurredAt: { gte: start, lte: end } },
      _sum: { amount: true },
    });

    const today = Number(agg._sum.amount ?? 0);
    const remain = Math.max(0, DAILY_CAP - today);
    const credit = Math.min(remain, amount);
    if (credit <= 0) return bad("daily cap reached", 403);

    const occurredAt = new Date();
    const dedupeKey =
      body.nonce
        ? `earn:${user.id}:${body.type}:${body.nonce}`
        : `earn:${user.id}:${body.type}:${crypto.randomUUID()}`;

    const result = await prisma.$transaction(async (tx) => {
      const ev = await tx.pointEvent.create({
        data: {
          userId: user.id,
          nodeId: null,
          type: body.type,
          amount: credit,
          meta: body.meta ?? {},
          source: "api/points/earn",
          ruleVersion: "v1",
          dedupeKey,
          nonce: body.nonce ?? null,
          signatureOk: true,
          riskScore: 0,
          occurredAt,
        },
        select: { id: true },
      });

      const balance = await tx.pointBalance.upsert({
        where: { userId: user.id },
        update: { balance: { increment: credit } },
        create: { userId: user.id, balance: credit, slk: 0 },
        select: { balance: true, slk: true },
      });

      return { ev, balance };
    });

    const usedToday = today + credit;
    const remainToday = Math.max(0, DAILY_CAP - usedToday);

    return NextResponse.json({
      ok: true,
      credited: credit,
      eventId: result.ev.id,
      daily: { used: usedToday, cap: DAILY_CAP, remain: remainToday },
      balance: { points: result.balance.balance, slk: result.balance.slk },
    });
  } catch (e: any) {
    console.error("points/earn error:", e);
    const status = e?.status ?? 500;
    return NextResponse.json({ ok: false, error: e?.message ?? "internal error" }, { status });
  }
}
