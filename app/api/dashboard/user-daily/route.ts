// app/api/dashboard/user-daily/route.ts
// User's daily points — reads from pointEvents (NOT metricsDaily which was reset)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function daysForRange(range: string) {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  return 1;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const range = (url.searchParams.get("range") || "today").toLowerCase();
    const days = daysForRange(range);

    const ctx = await getAuthContext(req);
    const wallet = ctx?.wallet ?? null;
    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({ where: { wallet }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const dayStart = startOfUtcDay(now);
    const rangeStart = new Date(dayStart.getTime() - (days - 1) * 86_400_000);

    // Fetch events in range and group by day
    const events = await prisma.pointEvent.findMany({
      where: {
        userId: user.id,
        occurredAt: { gte: rangeStart },
        amount: { gt: 0 },
      },
      select: { occurredAt: true, amount: true },
    });

    // Build dayMap: "YYYY-MM-DD" -> total points
    const dayMap = new Map<string, number>();
    for (const ev of events) {
      const d = new Date(ev.occurredAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      dayMap.set(key, (dayMap.get(key) ?? 0) + ev.amount);
    }

    // Build full series buckets
    const series = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(rangeStart);
      d.setUTCDate(d.getUTCDate() + i);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      series.push({
        dayUtc: d.toISOString(),
        label: key,
        points: dayMap.get(key) ?? 0,
      });
    }

    const todayKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
    const todayTotal = dayMap.get(todayKey) ?? 0;

    return NextResponse.json(
      {
        ok: true,
        range,
        tz: "UTC",
        todayTotal,
        series,
        daily: series.map((x) => ({ dayUtc: x.dayUtc, label: x.label, pointsEarned: x.points })),
        items: series,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dashboard/user-daily]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
