// app/api/dashboard/metrics/route.ts
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
function addHoursUtc(d: Date, hours: number) {
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
}
function getRange(q: string | null): DashboardRange {
  if (q === "7d" || q === "30d") return q;
  return "today";
}
function hourKeyISO(d: Date) {
  // normalize เป็น HH:00Z
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), 0, 0, 0)
  ).toISOString();
}

export async function GET(req: Request) {
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

  // helper: สร้าง bucket ชั่วโมงให้ครบตั้งแต่ startUtc ถึง endUtc (ไม่รวม endUtc)
  const makeBuckets = () => {
    const out: Array<{ hourUtc: string; pointsEarned: number }> = [];
    const hours = Math.max(1, Math.round((endUtc.getTime() - startUtc.getTime()) / 3_600_000));
    for (let i = 0; i < hours; i++) {
      const h = addHoursUtc(startUtc, i);
      out.push({ hourUtc: hourKeyISO(h), pointsEarned: 0 });
    }
    return out;
  };

  // ✅ TODAY: live จาก PointEvent (รวมทุก user)
  if (range === "today") {
    const events = await prisma.pointEvent.findMany({
      where: { occurredAt: { gte: startUtc, lt: endUtc } },
      select: { occurredAt: true, amount: true },
      orderBy: { occurredAt: "asc" },
    });

    const buckets = Array.from({ length: 24 }, (_, h) => {
      const hourUtc = new Date(
        Date.UTC(
          startUtc.getUTCFullYear(),
          startUtc.getUTCMonth(),
          startUtc.getUTCDate(),
          h,
          0,
          0,
          0
        )
      );
      return { hourUtc: hourUtc.toISOString(), pointsEarned: 0 };
    });

    for (const ev of events) {
      const h = ev.occurredAt.getUTCHours();
      if (h >= 0 && h < 24) buckets[h].pointsEarned += ev.amount ?? 0;
    }

    const totalPoints = buckets.reduce((s, r) => s + (r.pointsEarned ?? 0), 0);

    return NextResponse.json(
      {
        ok: true,
        range,
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
        totalPoints,
        hourly: buckets,
        source: "live_point_event",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // ✅ 7d/30d: พยายามอ่าน rollup ก่อน (MetricsHourly global)
  // รองรับทั้ง userId null และ ""
  const rolled = await prisma.metricsHourly.findMany({
    where: {
      hourUtc: { gte: startUtc, lt: endUtc },
      OR: [{ userId: null }, { userId: "" }],
    },
    orderBy: { hourUtc: "asc" },
    select: { hourUtc: true, pointsEarned: true },
  });

  const buckets = makeBuckets();
  const map = new Map<string, number>();
  for (const r of rolled) map.set(hourKeyISO(r.hourUtc), r.pointsEarned ?? 0);

  // merge rollup -> buckets
  let nonZero = 0;
  for (const b of buckets) {
    const v = map.get(b.hourUtc);
    if (typeof v === "number") b.pointsEarned = v;
    if (b.pointsEarned !== 0) nonZero++;
  }

  // ถ้า rollup ว่าง/แทบไม่มี → fallback ไปคำนวณจาก PointEvent
  // (ช่วยให้ 7d ขึ้นกราฟแม้ยังไม่ได้รัน rollup)
  const shouldFallback = rolled.length === 0 || nonZero === 0;

  if (shouldFallback) {
    const events = await prisma.pointEvent.findMany({
      where: { occurredAt: { gte: startUtc, lt: endUtc } },
      select: { occurredAt: true, amount: true },
      orderBy: { occurredAt: "asc" },
    });

    // sum per hour
    const liveMap = new Map<string, number>();
    for (const ev of events) {
      const k = hourKeyISO(ev.occurredAt);
      liveMap.set(k, (liveMap.get(k) ?? 0) + (ev.amount ?? 0));
    }

    for (const b of buckets) {
      b.pointsEarned = liveMap.get(b.hourUtc) ?? 0;
    }

    const totalPoints = buckets.reduce((s, r) => s + (r.pointsEarned ?? 0), 0);

    return NextResponse.json(
      {
        ok: true,
        range,
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
        totalPoints,
        hourly: buckets,
        source: "fallback_point_event",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const hourly = buckets;
  const totalPoints = hourly.reduce((s, r) => s + (r.pointsEarned ?? 0), 0);

  return NextResponse.json(
    {
      ok: true,
      range,
      startUtc: startUtc.toISOString(),
      endUtc: endUtc.toISOString(),
      totalPoints,
      hourly,
      source: "metrics_hourly_rollup",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
