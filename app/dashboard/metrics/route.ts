// app/api/dashboard/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export const runtime = "nodejs";

// ใช้ user system สำหรับภาพรวมทั้งระบบ
const GLOBAL_USER_ID = process.env.METRICS_GLOBAL_USER_ID ?? "system";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const daysParam = url.searchParams.get("days");
    const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 90) : 30;

    const now = new Date();

    // --- ช่วงเวลา daily (ย้อนหลัง N วัน) ---
    const fromDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    fromDay.setUTCDate(fromDay.getUTCDate() - (days - 1));

    const daily = await prisma.metricsDaily.findMany({
      where: {
        userId: GLOBAL_USER_ID,
        dayUtc: {
          gte: fromDay,
          lte: now,
        },
      },
      orderBy: { dayUtc: "asc" },
    });

    // --- ช่วงเวลา hourly (24 ชั่วโมงล่าสุด) ---
    const fromHour = new Date(now.getTime() - 24 * 3600_000);

    const hourly = await prisma.metricsHourly.findMany({
      where: {
        userId: GLOBAL_USER_ID,
        hourUtc: {
          gte: fromHour,
          lte: now,
        },
      },
      orderBy: { hourUtc: "asc" },
    });

    // === สร้าง summary คร่าว ๆ ===
    const todayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const yesterdayUtc = new Date(todayUtc.getTime() - 86400_000);

    const sumLastNDays = daily.reduce((s, d) => s + (d.pointsEarned ?? 0), 0);

    const todayRow = daily.find(
      (d) =>
        d.dayUtc.getUTCFullYear() === todayUtc.getUTCFullYear() &&
        d.dayUtc.getUTCMonth() === todayUtc.getUTCMonth() &&
        d.dayUtc.getUTCDate() === todayUtc.getUTCDate()
    );
    const yesterdayRow = daily.find(
      (d) =>
        d.dayUtc.getUTCFullYear() === yesterdayUtc.getUTCFullYear() &&
        d.dayUtc.getUTCMonth() === yesterdayUtc.getUTCMonth() &&
        d.dayUtc.getUTCDate() === yesterdayUtc.getUTCDate()
    );

    const todayPoints = todayRow?.pointsEarned ?? 0;
    const yesterdayPoints = yesterdayRow?.pointsEarned ?? 0;

    const summary = {
      days,
      totalPointsLastNDays: sumLastNDays,
      todayPoints,
      yesterdayPoints,
      deltaVsYesterday: todayPoints - yesterdayPoints,
    };

    return NextResponse.json(
      {
        ok: true,
        summary,
        daily: daily.map((d) => ({
          dayIso: d.dayUtc.toISOString(),
          pointsEarned: d.pointsEarned ?? 0,
        })),
        hourly: hourly.map((h) => ({
          hourIso: h.hourUtc.toISOString(),
          pointsEarned: h.pointsEarned ?? 0,
          qfScore: h.qfScore ?? 0,
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[dashboard/metrics] error:", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
