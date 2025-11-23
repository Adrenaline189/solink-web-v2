// app/api/dashboard/metrics/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* --------------------------- helpers --------------------------- */
function toNum(v: any): number {
  if (typeof v === "bigint") return Number(v);
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function startOfUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDaysUTC(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/* ----------------------------- GET ----------------------------- */

/**
 * System Metrics (GLOBAL)
 * - ใช้สำหรับกราฟ System Hourly (UTC) บน Dashboard
 *
 * Response shape:
 * {
 *   ok: true,
 *   daily: { dayUtc: string, pointsEarned: number } | null,
 *   hourly: Array<{ hourUtc: string, pointsEarned: number }>
 * }
 */
export async function GET() {
  try {
    // วันนี้แบบ UTC
    const start = startOfUTC();
    const end = addDaysUTC(start, 1);

    // ---- 1) daily points ของระบบ (system row) ----
    let dailyPoints = 0;

    // พยายามอ่านจาก MetricsDaily ก่อน
    try {
      const md = await prisma.metricsDaily.findFirst({
        where: {
          dayUtc: start,
          userId: "system",
        },
        select: {
          pointsEarned: true,
        },
      });

      if (md?.pointsEarned != null) {
        dailyPoints = toNum(md.pointsEarned);
      }
    } catch {
      // ถ้า query metricsDaily พัง จะ fallback ไปอ่านจาก hourly ด้านล่าง
      dailyPoints = 0;
    }

    // ถ้า daily ยังเป็น 0 → ลอง sum จาก MetricsHourly
    if (dailyPoints === 0) {
      try {
        const agg = await prisma.metricsHourly.aggregate({
          _sum: { pointsEarned: true },
          where: {
            userId: "system",
            hourUtc: { gte: start, lt: end },
          },
        });
        dailyPoints = toNum(agg._sum.pointsEarned);
      } catch {
        dailyPoints = 0;
      }
    }

    const daily = {
      dayUtc: start.toISOString(),
      pointsEarned: dailyPoints,
    };

    // ---- 2) hourly rows ของระบบในวันนี้ ----
    let hourly: Array<{ hourUtc: string; pointsEarned: number }> = [];

    try {
      const rows = await prisma.metricsHourly.findMany({
        where: {
          userId: "system",
          hourUtc: { gte: start, lt: end },
        },
        orderBy: { hourUtc: "asc" },
        select: {
          hourUtc: true,
          pointsEarned: true,
        },
      });

      hourly = rows.map((r) => ({
        hourUtc: r.hourUtc.toISOString(),
        pointsEarned: toNum(r.pointsEarned),
      }));
    } catch (e) {
      console.error("metrics hourly error:", e);
      hourly = [];
    }

    return NextResponse.json(
      {
        ok: true,
        daily,
        hourly,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (e: any) {
    console.error("dashboard/metrics error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "internal error" },
      { status: 500 }
    );
  }
}
