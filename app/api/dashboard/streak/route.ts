// app/api/dashboard/streak/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = cookies();
    const cookieWallet = cookieStore.get("solink_wallet")?.value;
    const wallet = (cookieWallet || "").trim();
    if (!wallet) return bad("wallet cookie required", 401);

    const user = await prisma.user.findUnique({ where: { wallet }, select: { id: true } });
    if (!user) return bad("user not found for this wallet", 404);

    // Get daily point totals from pointEvents (last 365 days)
    const since = new Date();
    since.setUTCFullYear(since.getUTCFullYear() - 1);
    since.setUTCHours(0, 0, 0, 0);

    const events = await prisma.pointEvent.findMany({
      where: {
        userId: user.id,
        occurredAt: { gte: since },
        amount: { gt: 0 },
      },
      select: { occurredAt: true, amount: true },
    });

    // Map: "YYYY-MM-DD" -> has points
    const dayMap = new Map<string, boolean>();
    for (const ev of events) {
      const d = new Date(ev.occurredAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      if (!dayMap.has(key)) dayMap.set(key, ev.amount > 0);
    }

    const today = startOfUtcDay(new Date());

    let current = 0;
    let best = 0;
    let streak = 0;
    let currentRecorded = false;

    for (let i = 0; i < 365; i++) {
      const d = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i)
      );
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      const hasPoints = dayMap.get(key) ?? false;

      if (hasPoints) {
        streak++;
      } else {
        if (!currentRecorded) {
          current = streak;
          currentRecorded = true;
        }
        if (streak > best) best = streak;
        streak = 0;
      }
    }

    if (!currentRecorded) {
      current = streak;
    }
    if (streak > best) best = streak;

    return NextResponse.json({ ok: true, current, best });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("streak error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
