import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { cache } from "react";

export const revalidate = 60; // cache 1 นาที

// helper: UTC 0:00
function startOfUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// helper: เพิ่มชั่วโมง (UTC)
function addHoursUTC(date: Date, h: number) {
  const d = new Date(date);
  d.setUTCHours(d.getUTCHours() + h);
  return d;
}

export const GET = cache(async () => {
  try {
    const now = new Date();

    const todayUtc = startOfUTC(now);
    const yesterdayUtc = addHoursUTC(now, -24);

    /* ------------------------------------------------------------------
       1) DAILY (today)
    ------------------------------------------------------------------ */
    const dailyRow = await prisma.metricsDaily.findUnique({
      where: {
        dayUtc_userId_unique: {
          dayUtc: todayUtc,
          userId: "system",
        },
      },
      select: {
        dayUtc: true,
        pointsEarned: true,
      },
    });

    const daily = dailyRow
      ? {
          dayUtc: dailyRow.dayUtc.toISOString(),
          pointsEarned: dailyRow.pointsEarned ?? 0,
        }
      : null;

    /* ------------------------------------------------------------------
       2) HOURLY (ย้อนหลัง 24 ชั่วโมง)
    ------------------------------------------------------------------ */
    const hourlyRows = await prisma.metricsHourly.findMany({
      where: {
        userId: "system",
        hourUtc: { gte: yesterdayUtc, lte: now },
      },
      orderBy: { hourUtc: "asc" },
      select: {
        hourUtc: true,
        pointsEarned: true,
        qfScore: true,
      },
    });

    const hourly = hourlyRows.map((r) => ({
      hourUtc: r.hourUtc.toISOString(),
      pointsEarned: Number(r.pointsEarned ?? 0),
      qfScore: Number(r.qfScore ?? 0),
    }));

    return NextResponse.json(
      {
        ok: true,
        daily,
        hourly,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("metrics api error:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Internal Server Error" },
      { status: 500 }
    );
  }
});
