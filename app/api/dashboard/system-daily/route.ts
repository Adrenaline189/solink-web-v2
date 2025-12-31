// app/api/dashboard/system-daily/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardRange = "today" | "7d" | "30d";

function floorUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function addDaysUtc(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}
function dayLabel(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function getRange(q: string | null): DashboardRange {
  if (q === "7d" || q === "30d") return q;
  return "today";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const range = getRange(url.searchParams.get("range"));

  const now = new Date();
  const day0 = floorUtcDay(now);

  let startUtc: Date;
  let endUtc: Date;
  let daysCount: number;

  if (range === "today") {
    startUtc = day0;
    endUtc = addDaysUtc(day0, 1);
    daysCount = 1;
  } else if (range === "7d") {
    startUtc = addDaysUtc(day0, -6);
    endUtc = addDaysUtc(day0, 1);
    daysCount = 7;
  } else {
    startUtc = addDaysUtc(day0, -29);
    endUtc = addDaysUtc(day0, 1);
    daysCount = 30;
  }

  // helper: เติมวันให้ครบช่วง (กัน days=[] แล้วหน้าไม่วาด)
  const makeDayBuckets = (getter?: (label: string) => number) => {
    return Array.from({ length: daysCount }, (_, i) => {
      const d = addDaysUtc(startUtc, i);
      const label = dayLabel(d);
      return {
        dayUtc: d.toISOString(),
        label,
        pointsEarned: getter ? getter(label) : 0,
      };
    });
  };

  // ✅ TODAY: live จาก PointEvent (รวมทุก user)
  if (range === "today") {
    const agg = await prisma.pointEvent.aggregate({
      where: { occurredAt: { gte: startUtc, lt: endUtc } },
      _sum: { amount: true },
    });

    const pointsEarned = agg._sum.amount ?? 0;

    return NextResponse.json(
      {
        ok: true,
        range,
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
        totalPoints: pointsEarned,
        days: [
          {
            dayUtc: startUtc.toISOString(),
            label: dayLabel(startUtc),
            pointsEarned,
          },
        ],
        source: "live_point_event",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // ✅ 7d/30d: พยายามอ่าน rollup ก่อน (MetricsDaily global)
  // รองรับทั้ง userId null และ ""
  const rolled = await prisma.metricsDaily.findMany({
    where: {
      dayUtc: { gte: startUtc, lt: endUtc },
      OR: [{ userId: null }, { userId: "" }],
    },
    orderBy: { dayUtc: "asc" },
    select: { dayUtc: true, pointsEarned: true },
  });

  const rolledMap = new Map<string, number>();
  for (const r of rolled) rolledMap.set(dayLabel(r.dayUtc), r.pointsEarned ?? 0);

  // ทำ buckets จาก rollup (และเติมวันที่หายให้ครบ)
  let days = makeDayBuckets((lbl) => rolledMap.get(lbl) ?? 0);
  let nonZero = days.reduce((c, d) => c + (d.pointsEarned !== 0 ? 1 : 0), 0);

  // fallback เงื่อนไข: rollup ว่าง หรือทั้งหมดเป็น 0
  const shouldFallback = rolled.length === 0 || nonZero === 0;

  if (shouldFallback) {
    // ✅ fallback: รวม PointEvent แบบรายวัน แล้วเติมวันให้ครบ
    const events = await prisma.pointEvent.findMany({
      where: { occurredAt: { gte: startUtc, lt: endUtc } },
      select: { occurredAt: true, amount: true },
      orderBy: { occurredAt: "asc" },
    });

    const liveMap = new Map<string, number>();
    for (const ev of events) {
      const k = dayLabel(ev.occurredAt); // ใช้วัน UTC
      liveMap.set(k, (liveMap.get(k) ?? 0) + (ev.amount ?? 0));
    }

    days = makeDayBuckets((lbl) => liveMap.get(lbl) ?? 0);

    const totalPoints = days.reduce((s, d) => s + (d.pointsEarned ?? 0), 0);

    return NextResponse.json(
      {
        ok: true,
        range,
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
        totalPoints,
        days,
        source: "fallback_point_event",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const totalPoints = days.reduce((s, d) => s + (d.pointsEarned ?? 0), 0);

  return NextResponse.json(
    {
      ok: true,
      range,
      startUtc: startUtc.toISOString(),
      endUtc: endUtc.toISOString(),
      totalPoints,
      days,
      source: "metrics_daily_rollup",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
