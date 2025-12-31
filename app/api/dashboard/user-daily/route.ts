// app/api/dashboard/user-daily/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

function floorUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUtc(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function fmtDayLabel(d: Date) {
  // YYYY-MM-DD (UTC)
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getRange(q: string | null): "today" | "7d" | "30d" {
  if (q === "7d" || q === "30d") return q;
  return "today";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const range = getRange(url.searchParams.get("range"));

  const store = cookies();
  const wallet = store.get("solink_wallet")?.value;
  const auth = store.get("solink_auth")?.value;

  if (!wallet || !auth) {
    return NextResponse.json(
      { ok: false, error: "Not authenticated", items: [] },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const user = await prisma.user.findFirst({ where: { wallet } });
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "User not found", items: [] },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

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

  // ✅ TODAY: ใช้ PointEvent สด → ให้กราฟวันนี้มีค่าแน่นอน
  if (range === "today") {
    const agg = await prisma.pointEvent.aggregate({
      where: {
        userId: user.id,
        occurredAt: { gte: startUtc, lt: endUtc },
      },
      _sum: { amount: true },
    });

    const points = agg._sum.amount ?? 0;

    return NextResponse.json(
      {
        ok: true,
        range,
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
        items: [
          {
            dayUtc: startUtc.toISOString(),
            label: fmtDayLabel(startUtc),
            points,
          },
        ],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // 7d/30d: ใช้ MetricsDaily (rollup) ตามเดิม
  const rows = await prisma.metricsDaily.findMany({
    where: {
      userId: user.id,
      dayUtc: { gte: startUtc, lt: endUtc },
    },
    orderBy: { dayUtc: "asc" },
    select: { dayUtc: true, pointsEarned: true },
  });

  // เติมวันให้ครบ (ถ้าวันไหนไม่มีแถว ให้เป็น 0)
  const map = new Map<string, number>();
  for (const r of rows) map.set(fmtDayLabel(r.dayUtc), r.pointsEarned ?? 0);

  const items = Array.from({ length: daysCount }, (_, i) => {
    const d = addDaysUtc(startUtc, i);
    const label = fmtDayLabel(d);
    return {
      dayUtc: d.toISOString(),
      label,
      points: map.get(label) ?? 0,
    };
  });

  return NextResponse.json(
    {
      ok: true,
      range,
      startUtc: startUtc.toISOString(),
      endUtc: endUtc.toISOString(),
      items,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
