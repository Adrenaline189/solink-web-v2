// app/api/points/earn/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/auth";
import { POLICY, DAILY_CAP, type EarnType } from "@/lib/policy";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";

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
    // 🔐 API key สำหรับ extension / worker
    requireApiKey(req);

    // 🛡️ rate limit ต่อ IP
    rateLimit(req.ip ?? "unknown", Number(process.env.RATE_LIMIT_PER_MIN ?? 30));

    const body = (await req.json()) as Body;
    if (!body?.wallet) return bad("wallet required");
    if (!body?.type) return bad("type required");

    const policy = POLICY[body.type];
    if (!policy) return bad("unsupported type");

    const amount = Math.max(0, Math.min(policy.maxPerEvent, Number(body.amount ?? 0)));
    if (!amount) return bad("amount must be > 0");

    // 🧬 Upsert user by wallet
    const user = await prisma.user.upsert({
      where: { wallet: body.wallet },
      update: {},
      create: { wallet: body.wallet },
    });

    // ⏱️ Enforce cooldown per type using last event time
    const last = await prisma.pointEvent.findFirst({
      where: { userId: user.id, type: body.type },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, nonce: true },
    });

    const now = Date.now();
    if (last && policy.cooldownSec > 0) {
      const diff = (now - new Date(last.createdAt).getTime()) / 1000;
      if (diff < policy.cooldownSec) {
        return bad(`cooldown: wait ${Math.ceil(policy.cooldownSec - diff)}s`, 429);
      }
    }

    // 🧿 Idempotency by client nonce (optional)
    if (body.nonce) {
      const dup = await prisma.pointEvent.findFirst({
        where: { userId: user.id, nonce: body.nonce },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
    }

    // 📆 Enforce daily cap (นับจาก PointEvent)
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    const agg = await prisma.pointEvent.aggregate({
      where: { userId: user.id, createdAt: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    const today = Number(agg._sum.amount ?? 0);
    const remain = Math.max(0, DAILY_CAP - today);
    const credit = Math.min(remain, amount);
    if (credit <= 0) return bad("daily cap reached", 403);

    // 💎 Transaction: สร้าง PointEvent + อัปเดต PointBalance ให้ตรงกับแต้มที่เพิ่ม
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 1) log event
        const ev = await tx.pointEvent.create({
          data: {
            userId: user.id,
            type: body.type,
            amount: credit,
            nonce: body.nonce ?? null,
            meta: body.meta ?? {},
          },
        });

        // 2) upsert balance (เพิ่มแต้มเข้า balance)
        const balance = await tx.pointBalance.upsert({
          where: { userId: user.id },
          update: {
            balance: { increment: credit },
          },
          create: {
            userId: user.id,
            balance: credit,
            // ถ้า schema มี slk ด้วย ให้ใส่ 0 ให้ชัด ๆ
            slk: 0,
          },
        });

        return { ev, balance };
      }
    );

    const usedToday = today + credit;
    const remainToday = Math.max(0, DAILY_CAP - usedToday);

    return NextResponse.json({
      ok: true,
      credited: credit,
      eventId: result.ev.id,
      daily: {
        used: usedToday,
        cap: DAILY_CAP,
        remain: remainToday,
      },
      balance: {
        points: result.balance.balance,
        slk: (result as any).balance.slk ?? undefined, // ถ้ามี field slk
      },
    });
  } catch (e: any) {
    console.error("points/earn error:", e);
    const status = e?.status ?? 500;
    return NextResponse.json({ ok: false, error: e?.message ?? "internal error" }, { status });
  }
}
