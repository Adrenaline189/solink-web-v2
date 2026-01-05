import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardRange = "today" | "7d" | "30d";

function floorUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}
function startUtcHour(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), 0, 0, 0));
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
  // normalize เป็น HH:00:00Z
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), 0, 0, 0)
  ).toISOString();
}
function clamp0(n: unknown) {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, x);
}

export async function GET(req: NextRequest) {
  try {
    // 1) auth
    const ctx = await getAuthContext(req);
    if (!ctx?.wallet) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    // 2) map wallet -> user.id (สำคัญมาก)
    const user = await prisma.user.findFirst({
      where: { wallet: ctx.wallet },
      select: { id: true, wallet: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 3) range
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

    // 4) buckets ชม. ให้ครบ
    const hours = Math.max(1, Math.round((endUtc.getTime() - startUtc.getTime()) / 3_600_000));
    const buckets: Array<{ hourUtc: string; pointsEarned: number }> = [];
    for (let i = 0; i < hours; i++) {
      const h = addHoursUtc(startUtc, i);
      buckets.push({ hourUtc: hourKeyISO(h), pointsEarned: 0 });
    }

    // ✅ นับเฉพาะแต้มที่ "ได้" จริง ๆ (ไม่รวม convert_debit)
    const EARN_TYPES = ["extension_farm", "UPTIME_MINUTE", "referral", "referral_bonus"] as const;

    // 5) try rollup ก่อน (MetricsHourly)
    const rolled = await prisma.metricsHourly.findMany({
      where: {
        userId: user.id,
        hourUtc: { gte: startUtc, lt: endUtc },
      },
      orderBy: { hourUtc: "asc" },
      select: { hourUtc: true, pointsEarned: true },
    });

    const rollMap = new Map<string, number>();
    for (const r of rolled) rollMap.set(hourKeyISO(r.hourUtc), clamp0(r.pointsEarned));

    let nonZero = 0;
    for (const b of buckets) {
      const v = rollMap.get(b.hourUtc);
      if (typeof v === "number") b.pointsEarned = v;
      if (b.pointsEarned !== 0) nonZero++;
    }

    const shouldFallback = rolled.length === 0 || nonZero === 0;

    // 6) fallback จาก PointEvent ถ้า rollup ว่าง
    if (shouldFallback) {
      const events = await prisma.pointEvent.findMany({
        where: {
          userId: user.id,
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
        liveMap.set(k, (liveMap.get(k) ?? 0) + clamp0(ev.amount));
      }

      for (const b of buckets) {
        b.pointsEarned = clamp0(liveMap.get(b.hourUtc) ?? 0);
      }

      const todayTotal = buckets.reduce((s, x) => s + clamp0(x.pointsEarned), 0);

      return NextResponse.json(
        {
          ok: true,
          range,
          tz: "UTC",
          startUtc: startUtc.toISOString(),
          endUtc: endUtc.toISOString(),
          todayTotal,
          series: buckets.map((x) => ({ hourUtc: x.hourUtc, points: x.pointsEarned })),
          hourly: buckets,
          source: "fallback_point_event",
        },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 7) rollup path
    const todayTotal = buckets.reduce((s, x) => s + clamp0(x.pointsEarned), 0);

    return NextResponse.json(
      {
        ok: true,
        range,
        tz: "UTC",
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
        todayTotal,
        series: buckets.map((x) => ({ hourUtc: x.hourUtc, points: x.pointsEarned })),
        hourly: buckets,
        source: "metrics_hourly_rollup",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("[dashboard/hourly] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
