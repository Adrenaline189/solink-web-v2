// app/api/dashboard/system-daily/route.ts
// System-wide daily points — aggregates ALL users' pointEvents per day
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
    const tz = "UTC";

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

    // Group by day using raw SQL (PostgreSQL date_trunc)
    const rows = await prisma.$queryRaw<{ day_label: string; total: bigint }[]>`
      SELECT
        DATE_TRUNC('day', "occurredAt" AT TIME ZONE 'UTC') AS day_label,
        SUM("amount")::bigint AS total
      FROM "PointEvent"
      WHERE "occurredAt" >= ${startUtc}
        AND "occurredAt" < ${endUtc}
        AND "amount" > 0
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const dayMap = new Map<string, number>();
    for (const r of rows) {
      const label = String(r.day_label).slice(0, 10);
      dayMap.set(label, Number(r.total));
    }

    const buckets = Array.from({ length: daysCount }).map((_, i) => {
      const d = addDaysUtc(startUtc, i);
      const label = d.toISOString().slice(0, 10);
      return { dayUtc: d.toISOString(), label, points: dayMap.get(label) ?? 0 };
    });

    const todayTotal = dayMap.get(day0.toISOString().slice(0, 10)) ?? 0;

    return NextResponse.json(
      {
        ok: true,
        range,
        tz,
        todayTotal,
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
