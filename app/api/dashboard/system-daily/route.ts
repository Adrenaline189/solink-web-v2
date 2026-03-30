// app/api/dashboard/system-daily/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type DashboardRange = "today" | "7d" | "30d";

function getRange(q: string | null): DashboardRange {
  if (q === "7d" || q === "30d") return q;
  return "today";
}

function floorUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function addDaysUtc(d: Date, days: number) {
  return new Date(d.getTime() + days * 86_400_000);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const range = getRange(url.searchParams.get("range"));

    const now = new Date();
    const day0 = floorUtcDay(now);

    let startUtc: Date;
    let endUtc: Date;

    if (range === "today") {
      startUtc = day0;
      endUtc = addDaysUtc(day0, 1);
    } else if (range === "7d") {
      startUtc = addDaysUtc(day0, -6);
      endUtc = addDaysUtc(day0, 1);
    } else {
      startUtc = addDaysUtc(day0, -29);
      endUtc = addDaysUtc(day0, 1);
    }

    const daysCount = Math.max(1, Math.round((endUtc.getTime() - startUtc.getTime()) / 86_400_000));

    // 1) วันก่อนหน้า: ดึงจาก metricsDaily (rolled data)
    const rolledRows = await prisma.metricsDaily.findMany({
      where: {
        dayUtc: { gte: startUtc, lt: day0 },
        userId: null,
      },
      select: { dayUtc: true, pointsEarned: true },
    });
    const rolledMap = new Map<string, number>();
    for (const r of rolledRows) {
      rolledMap.set(r.dayUtc.toISOString().slice(0, 10), Number(r.pointsEarned ?? 0));
    }

    // 2) วันนี้ (ongoing): ดึงจาก pointEvents โดยตรง
    const todayEvents = await prisma.pointEvent.findMany({
      where: {
        occurredAt: { gte: day0, lt: addDaysUtc(day0, 1) },
        amount: { gt: 0 },
      },
      select: { amount: true },
    });
    const todayTotal = todayEvents.reduce((s, e) => s + Number(e.amount ?? 0), 0);

    // 3) สร้าง buckets ครอบคลุมทุกวัน
    const buckets = Array.from({ length: daysCount }).map((_, i) => {
      const d = addDaysUtc(startUtc, i);
      const label = d.toISOString().slice(0, 10);
      const isToday = d.getTime() === day0.getTime();
      const points = isToday ? todayTotal : (rolledMap.get(label) ?? 0);
      return { dayUtc: d.toISOString(), label, points };
    });

    const todayTotalFromMap = buckets.find(b => b.label === day0.toISOString().slice(0, 10))?.points ?? 0;

    return NextResponse.json(
      {
        ok: true,
        range,
        tz: "UTC",
        todayTotal: todayTotalFromMap,
        series: buckets,
        daily: buckets,
        days: buckets,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dashboard/system-daily]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
