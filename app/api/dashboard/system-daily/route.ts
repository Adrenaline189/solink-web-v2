import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function clamp0(n: any) {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? Math.max(0, v) : 0;
}

export async function GET(req: Request) {
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
    const buckets = Array.from({ length: daysCount }).map((_, i) => {
      const d = addDaysUtc(startUtc, i);
      const iso = d.toISOString();
      return { dayUtc: iso, label: iso.slice(0, 10), points: 0 };
    });

    const rows = await prisma.metricsDaily.findMany({
      where: {
        dayUtc: { gte: startUtc, lt: endUtc },
        userId: "system",
      },
      orderBy: { dayUtc: "asc" },
      select: { dayUtc: true, pointsEarned: true },
    });

    const map = new Map<string, number>();
    for (const r of rows) map.set(floorUtcDay(r.dayUtc).toISOString(), clamp0(r.pointsEarned));

    for (const b of buckets) {
      b.points = clamp0(map.get(b.dayUtc) ?? 0);
    }

    const todayTotal = clamp0(map.get(day0.toISOString()) ?? 0);

    return NextResponse.json(
      {
        ok: true,
        range,
        tz,
        todayTotal,

        // ✅ UI-friendly
        series: buckets.map((x) => ({ dayUtc: x.dayUtc, label: x.label, points: x.points })),

        // ✅ compat
        daily: buckets.map((x) => ({ dayUtc: x.dayUtc, label: x.label, pointsEarned: x.points })),

        // (ถ้าคุณมี UI เก่าที่เรียก days)
        days: buckets.map((x) => ({ dayUtc: x.dayUtc, label: x.label, pointsEarned: x.points })),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("[dashboard/system-daily] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
