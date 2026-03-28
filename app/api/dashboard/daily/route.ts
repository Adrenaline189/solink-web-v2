// app/api/dashboard/daily/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get("days") ?? "30";
    const days = Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 365);

    const ctx = await getAuthContext(req);
    const wallet = ctx?.wallet ?? searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({ where: { wallet }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setUTCDate(fromDate.getUTCDate() - (days - 1));
    fromDate.setUTCHours(0, 0, 0, 0);

    // Fetch events and group by day in JS (avoids $queryRaw complexity)
    const events = await prisma.pointEvent.findMany({
      where: {
        userId: user.id,
        occurredAt: { gte: fromDate },
        amount: { gt: 0 },
      },
      select: { occurredAt: true, amount: true },
    });

    const dayMap = new Map<string, number>();
    for (const ev of events) {
      const d = new Date(ev.occurredAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      dayMap.set(key, (dayMap.get(key) ?? 0) + ev.amount);
    }

    const data = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(fromDate);
      d.setUTCDate(d.getUTCDate() + i);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      data.push({
        dayUtc: d.toISOString(),
        pointsEarned: dayMap.get(key) ?? 0,
        uptimePct: 0,
        avgBandwidthMbps: 0,
        qfScore: 0,
        trustScore: 0,
      });
    }

    return NextResponse.json({ ok: true, userId: user.id, days, data }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/dashboard/daily] error", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
