// app/api/dashboard/metrics/route.ts
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

    // Prisma จะ infer type ให้เอง ไม่ต้อง import model
    const rows = await prisma.metricsHourly.findMany({
      where: {
        userId: "system",
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

    const totalPoints = hourly.reduce(
      (sum, h) => sum + h.pointsEarned,
      0
    );

    const payload: SystemMetricsResp = {
      ok: true,
      range,
      startUtc: startUtc.toISOString(),
      endUtc: endUtc.toISOString(),
      totalPoints,
      hourly,
    };

    return NextResponse.json(payload);
  } catch (e) {
    console.error("metrics error:", e);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
