// app/api/dashboard/user-daily/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function daysForRange(range: string) {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  return 1; // today
}

function clamp0(n: any) {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? Math.max(0, v) : 0;
}

type DailyPoint = { dayUtc: string; points: number };

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const range = (url.searchParams.get("range") || "today").toLowerCase();

    const ctx = await getAuthContext(req);
    if (!ctx?.wallet) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({ where: { wallet: ctx.wallet } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const dayStart = startOfUtcDay(now);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const days = daysForRange(range);
    const rangeStart =
      range === "today" ? dayStart : new Date(dayStart.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    const rows = await prisma.metricsDaily.findMany({
      where: {
        userId: user.id,
        dayUtc: { gte: rangeStart, lt: dayEnd },
      },
      select: { dayUtc: true, pointsEarned: true },
      orderBy: { dayUtc: "asc" },
      take: days,
    });

    const m = new Map<string, number>();
    for (const r of rows) {
      m.set(r.dayUtc.toISOString(), clamp0(r.pointsEarned));
    }

    const series: DailyPoint[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(rangeStart.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString();
      series.push({ dayUtc: key, points: clamp0(m.get(key) ?? 0) });
    }

    const todayTotal = clamp0(series[series.length - 1]?.points ?? 0);

    return NextResponse.json(
      { ok: true, range, tz: "UTC", todayTotal, series },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("[dashboard/user-daily] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
