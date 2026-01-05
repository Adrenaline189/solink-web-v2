// app/api/dev/seed-points/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/auth";
import crypto from "crypto";

type Body = {
  wallet?: string;
  amount?: number;
  type?: string; // optional override event type
};

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: NextRequest) {
  try {
    // ✅ auth ด้วย API_KEY (ไม่ใช้ cookie)
    requireApiKey(req);

    const body = (await req.json().catch(() => ({}))) as Body;

    const wallet = (body.wallet || "").trim();
    const amount = Number(body.amount);

    if (!wallet) return bad("wallet is required", 400);
    if (!Number.isFinite(amount) || amount <= 0)
      return bad("amount must be a positive number", 400);

    // default earn type (อย่าใช้ type debit)
    const type = (body.type || "extension_farm").trim();

    // ✅ หา userId จริง (FK) จาก wallet
    const user = await prisma.user.findFirst({
      where: { wallet },
      select: { id: true, wallet: true },
    });

    if (!user) {
      // กัน FK พัง + บอกทางแก้
      return bad(
        `User not found for wallet. Please login once to create user record (wallet=${wallet}).`,
        404
      );
    }

    const now = new Date();

    // ✅ required fields ตาม schema ของ PointEvent
    const dedupeKey = `dev_seed:${user.id}:${now.toISOString()}:${crypto.randomUUID()}`;

    const ev = await prisma.pointEvent.create({
      data: {
        userId: user.id, // ✅ ใช้ User.id เท่านั้น
        type,
        amount,
        occurredAt: now,

        source: "dev_seed",
        ruleVersion: "1", // schema เป็น string
        createdAt: now,
        dedupeKey, // REQUIRED
      },
      select: {
        id: true,
        userId: true,
        type: true,
        amount: true,
        occurredAt: true,
        source: true,
        ruleVersion: true,
        dedupeKey: true,
      },
    });

    // ✅ อัปเดต balance ให้เห็นผลทันที (ถ้า schema ตรง)
    await prisma.pointBalance.upsert({
      where: { userId: user.id },
      update: { balance: { increment: amount } },
      create: { userId: user.id, balance: amount, slk: 0 },
    });

    return NextResponse.json({ ok: true, user, event: ev });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal error" },
      { status }
    );
  }
}
