// app/api/farm/credit/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type CreditBody = {
  userId?: string;   // เลือกอย่างใดอย่างหนึ่ง userId หรือ wallet
  wallet?: string;
  amount?: number;   // แต้มที่ต้องการเพิ่ม (ค่าบวก)
  reason?: string;   // note สั้น ๆ
};

/**
 * POST /api/farm/credit
 *
 * ใช้สำหรับเติมแต้มให้ user แบบ manual / internal
 * body:
 *  {
 *    "userId": "...",   // หรือ "wallet": "..."
 *    "amount": 10,
 *    "reason": "test credit"
 *  }
 *
 * response:
 *  {
 *    ok: true,
 *    balance: number,      // แต้มคงเหลือใหม่
 *    eventId: string
 *  }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as CreditBody;
    const { userId, wallet } = body;
    let { amount } = body;
    const { reason } = body;

    // ตรวจ body เบื้องต้น
    if (!userId && !wallet) {
      return NextResponse.json(
        { ok: false, error: "Missing userId or wallet" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number") {
      return NextResponse.json(
        { ok: false, error: "Missing numeric 'amount'" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Amount must be > 0" },
        { status: 400 }
      );
    }

    // หา user จาก userId หรือ wallet
    const where: { id?: string; wallet?: string | null } = {};
    if (userId) where.id = userId;
    if (wallet) where.wallet = wallet;

    const user = await prisma.user.findFirst({ where });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // ทำเป็น transaction:
    //  1) log PointEvent
    //  2) อัปเดต PointBalance (balance)
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const event = await tx.pointEvent.create({
          data: {
            userId: user.id,
            type: "extension_farm", // ใช้ type เดียวกับ heartbeat เพื่อความง่าย
            amount: Math.round(amount),
            meta: {
              source: "farm_credit",
              reason: reason ?? null,
            },
          },
        });

        const balance = await tx.pointBalance.upsert({
          where: { userId: user.id },
          update: {
            balance: { increment: Math.round(amount) },
          },
          create: {
            userId: user.id,
            balance: Math.round(amount),
            slk: 0,
          },
        });

        return { event, balance };
      }
    );

    return NextResponse.json(
      {
        ok: true,
        eventId: result.event.id,
        balance: result.balance.balance,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("farm/credit error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
