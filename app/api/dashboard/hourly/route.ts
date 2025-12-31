// app/api/dashboard/hourly/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

function floorUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUtc(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
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

  // ✅ TODAY: ใช้ PointEvent live + ส่ง ts ด้วย (ให้ component ใช้ format เดียวกันทุก range)
  if (range === "today") {
    const events = await prisma.pointEvent.findMany({
      where: {
        userId: user.id,
        occurredAt: { gte: startUtc, lt: endUtc },
      },
      select: { occurredAt: true, amount: true },
      orderBy: { occurredAt: "asc" },
    });

    // 24 buckets (UTC)
    const buckets = Array.from({ length: 24 }, (_, h) => {
      const hourDate = new Date(
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
      return {
        ts: hourDate.toISOString(), // ✅ สำคัญ
        time: `${String(h).padStart(2, "0")}:00`,
        points: 0,
      };
    });

    for (const ev of events) {
      const h = ev.occurredAt.getUTCHours();
      if (h >= 0 && h < 24) buckets[h].points += ev.amount ?? 0;
    }

    return NextResponse.json(
      {
        ok: true,
        range,
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
        items: buckets,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // 7d/30d: ใช้ MetricsHourly (rollup)
  const rows = await prisma.metricsHourly.findMany({
    where: {
      userId: user.id,
      hourUtc: { gte: startUtc, lt: endUtc },
    },
    orderBy: { hourUtc: "asc" },
    select: { hourUtc: true, pointsEarned: true },
  });

  const items = rows.map((r) => ({
    ts: r.hourUtc.toISOString(),
    points: r.pointsEarned ?? 0,
  }));

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
