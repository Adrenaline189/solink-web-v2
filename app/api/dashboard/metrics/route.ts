import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { DashboardRange } from "@/types/dashboard";
import { getRangeBounds } from "@/lib/dashboard-range";

type SystemHourRow = {
  hourUtc: string;
  pointsEarned: number;
};

type SystemMetricsResp = {
  ok: boolean;
  range: DashboardRange;
  startUtc: string;
  endUtc: string;
  totalPoints: number;
  hourly: SystemHourRow[];
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as DashboardRange) || "today";
    const { startUtc, endUtc } = getRangeBounds(range);

    const rows = await prisma.metricsHourly.findMany({
      where: {
        // ✅ รองรับทั้ง global(null) และ legacy("system")
        OR: [{ userId: null }, { userId: "system" }],
        hourUtc: {
          gte: startUtc,
          lt: endUtc,
        },
      },
      orderBy: { hourUtc: "asc" },
    });

    const hourly: SystemHourRow[] = rows.map((r) => ({
      hourUtc: r.hourUtc.toISOString(),
      pointsEarned: r.pointsEarned ?? 0,
    }));

    const totalPoints = hourly.reduce((sum, h) => sum + h.pointsEarned, 0);

    const payload: SystemMetricsResp = {
      ok: true,
      range,
      startUtc: startUtc.toISOString(),
      endUtc: endUtc.toISOString(),
      totalPoints,
      hourly,
    };

    return NextResponse.json(payload);
  } catch (e: any) {
    console.error("metrics error:", e);
    return NextResponse.json(
      // ✅ โชว์ message ชั่วคราว จะได้รู้สาเหตุถ้ายัง 500
      { ok: false, error: e?.message || "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
