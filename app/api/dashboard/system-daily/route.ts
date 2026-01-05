// app/api/dashboard/system-daily/route.ts
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
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
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

    // สร้าง bucket วันให้ครบทุกวันในช่วง
    const daysCount = Math.max(1, Math.round((endUtc.getTime() - startUtc.getTime()) / 86_400_000));
    const buckets: Array<{ dayUtc: string; points: number; pointsEarned: number }> = [];
    for (let i = 0; i < daysCount; i++) {
      const d = addDaysUtc(startUtc, i);
      buckets.push({
        dayUtc: d.toISOString(),
        points: 0,
        pointsEarned: 0,
      });
    }

    // อ่านจาก MetricsDaily (system)
    const rows = await prisma.metricsDaily.findMany({
      where: {
        dayUtc: { gte: startUtc, lt: endUtc },
        userId: "system",
      },
      orderBy: { dayUtc: "asc" },
      select: { dayUtc: true, pointsEarned: true },
    });

    // merge
    const map = new Map<string, number>();
    for (const r of rows) map.set(floorUtcDay(r.dayUtc).toISOString(), r.pointsEarned ?? 0);

    for (const b of buckets) {
      const v = map.get(b.dayUtc);
      const pts = typeof v === "number" ? v : 0;
      b.points = pts;
      b.pointsEarned = pts;
    }

    const todayKey = day0.toISOString();
    const todayTotal = map.get(todayKey) ?? 0;

    // ✅ ส่งทั้งรูปแบบใหม่/เก่า ให้ UI ที่คาดหวังคนละชื่อไม่พัง
    return NextResponse.json(
      {
        ok: true,
        range,
        tz,
        todayTotal,

        // รูปแบบที่คุณ curl เห็นอยู่แล้ว
        series: buckets.map((x) => ({ dayUtc: x.dayUtc, points: x.points })),

        // ✅ เพิ่มรูปแบบสำรอง (UI บางจุดชอบเรียก daily + pointsEarned)
        daily: buckets.map((x) => ({ dayUtc: x.dayUtc, pointsEarned: x.pointsEarned })),
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
