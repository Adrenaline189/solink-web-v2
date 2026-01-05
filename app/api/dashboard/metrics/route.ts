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
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), 0, 0, 0)
  ).toISOString();
}
function clamp0(n: number) {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

// ✅ นับเฉพาะแต้มที่ “ได้” จริง ๆ
const EARN_TYPES = ["extension_farm", "UPTIME_MINUTE", "referral", "referral_bonus"] as const;
const SYSTEM_USER_ID = "system";

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

  const makeBuckets = () => {
    const out: Array<{ hourUtc: string; pointsEarned: number }> = [];
    const hours = Math.max(1, Math.round((endUtc.getTime() - startUtc.getTime()) / 3_600_000));
    for (let i = 0; i < hours; i++) {
      const h = addHoursUtc(startUtc, i);
      out.push({ hourUtc: hourKeyISO(h), pointsEarned: 0 });
    }
    return out;
  };

  // ✅ TODAY: live จาก PointEvent (รวมทั้งระบบ) — เฉพาะ EARN
  if (range === "today") {
    const events = await prisma.pointEvent.findMany({
      where: {
        occurredAt: { gte: startUtc, lt: endUtc },
        type: { in: [...EARN_TYPES] },
        amount: { gt: 0 },
      },
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
      if (h >= 0 && h < 24) buckets[h].pointsEarned += clamp0(ev.amount ?? 0);
    }

    const totalPoints = buckets.reduce((s, r) => s + clamp0(r.pointsEarned ?? 0), 0);

    return NextResponse.json(
      {
        ok: true,
        range,
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
        totalPoints,
        hourly: buckets,
        source: "live_point_event_earned_only",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // ✅ 7d/30d: อ่าน rollup ก่อน (MetricsHourly global = userId "system")
  const rolled = await prisma.metricsHourly.findMany({
    where: {
      hourUtc: { gte: startUtc, lt: endUtc },
      userId: SYSTEM_USER_ID,
    },
    orderBy: { hourUtc: "asc" },
    select: { hourUtc: true, pointsEarned: true },
  });

  const buckets = makeBuckets();
  const map = new Map<string, number>();
  for (const r of rolled) map.set(hourKeyISO(r.hourUtc), clamp0(r.pointsEarned ?? 0));

  let nonZero = 0;
  for (const b of buckets) {
    const v = map.get(b.hourUtc);
    if (typeof v === "number") b.pointsEarned = v;
    if (b.pointsEarned !== 0) nonZero++;
  }

  const shouldFallback = rolled.length === 0 || nonZero === 0;

  // fallback: คำนวณจาก PointEvent (earned only)
  if (shouldFallback) {
    const events = await prisma.pointEvent.findMany({
      where: {
        occurredAt: { gte: startUtc, lt: endUtc },
        type: { in: [...EARN_TYPES] },
        amount: { gt: 0 },
      },
      select: { occurredAt: true, amount: true },
      orderBy: { occurredAt: "asc" },
    });

    const liveMap = new Map<string, number>();
    for (const ev of events) {
      const k = hourKeyISO(ev.occurredAt);
      liveMap.set(k, (liveMap.get(k) ?? 0) + clamp0(ev.amount ?? 0));
    }

    for (const b of buckets) {
      b.pointsEarned = clamp0(liveMap.get(b.hourUtc) ?? 0);
    }

    const totalPoints = buckets.reduce((s, r) => s + clamp0(r.pointsEarned ?? 0), 0);

    return NextResponse.json(
      {
        ok: true,
        range,
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
        totalPoints,
        hourly: buckets,
        source: "fallback_point_event_earned_only",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const totalPoints = buckets.reduce((s, r) => s + clamp0(r.pointsEarned ?? 0), 0);

  return NextResponse.json(
    {
      ok: true,
      range,
      startUtc: startUtc.toISOString(),
      endUtc: endUtc.toISOString(),
      totalPoints,
      hourly: buckets,
      source: "metrics_hourly_rollup_system",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
