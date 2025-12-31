// app/api/dev/seed-points/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const store = cookies();
    const wallet = store.get("solink_wallet")?.value;
    const auth = store.get("solink_auth")?.value;

    if (!wallet || !auth) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount ?? 100);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "amount must be > 0" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { wallet } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const ts = Date.now();
    const dedupeKey = `DEV_SEED:${user.id}:${ts}:${amount}`;

    const ev = await prisma.pointEvent.create({
      data: {
        userId: user.id,
        amount: Math.trunc(amount),

        type: "UPTIME_MINUTE", // ใช้ enum string ที่คุณคอมเมนต์ไว้ก็ได้
        source: "dev",
        ruleVersion: "1",

        dedupeKey,
        occurredAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        ok: true,
        eventId: ev.id,
        userId: user.id,
        wallet,
        amount: ev.amount,
        dedupeKey,
        occurredAt: ev.occurredAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("seed-points error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "seed failed" }, { status: 500 });
  }
}
