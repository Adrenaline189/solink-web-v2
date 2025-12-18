// app/api/dashboard/system-daily/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { DashboardRange } from "@/types/dashboard";
import { getRangeBounds, formatDayLabel } from "@/lib/dashboard-range";

type SystemDailyRow = {
  dayUtc: string;
  label: string;
  pointsEarned: number;
};

type SystemDailyResp = {
  ok: boolean;
  range: DashboardRange;
  startUtc: string;
  endUtc: string;
  totalPoints: number;
  days: SystemDailyRow[];
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as DashboardRange) || "7d";
    const { startUtc, endUtc } = getRangeBounds(range);

    // ✅ Global/System rows: รองรับทั้ง userId = null (global) และ legacy("system")
    const rows = await prisma.metricsDaily.findMany({
      where: {
        OR: [{ userId: null }, { userId: "system" }],
        dayUtc: { gte: startUtc, lt: endUtc },
      },
      orderBy: { dayUtc: "asc" },
    });

    const days: SystemDailyRow[] = rows.map((r) => {
      const d = new Date(r.dayUtc);
      return {
        dayUtc: d.toISOString(),
        label: formatDayLabel(d),
        pointsEarned: r.pointsEarned ?? 0,
      };
    });

    const totalPoints = days.reduce((sum, d) => sum + d.pointsEarned, 0);

    const payload: SystemDailyResp = {
      ok: true,
      range,
      startUtc: startUtc.toISOString(),
      endUtc: endUtc.toISOString(),
      totalPoints,
      days,
    };

    return NextResponse.json(payload);
  } catch (e) {
    console.error("system-daily error:", e);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch system daily stats" },
      { status: 500 }
    );
  }
}
