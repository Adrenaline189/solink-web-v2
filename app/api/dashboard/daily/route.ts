// app/api/dashboard/daily/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // ระบุจำนวนวันย้อนหลัง (default = 30, max = 365)
    const daysParam = searchParams.get("days") ?? "30";
    const days = Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 365);

    // TODO: ภายหลังเปลี่ยนมาใช้ user จาก auth
    const userId = searchParams.get("userId") ?? "system";

    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setUTCDate(fromDate.getUTCDate() - (days - 1));
    fromDate.setUTCHours(0, 0, 0, 0);

    const rows = await prisma.metricsDaily.findMany({
      where: {
        userId,
        dayUtc: {
          gte: fromDate,
        },
      },
      orderBy: {
        dayUtc: "asc",
      },
    });

    const data = rows.map((row) => ({
      dayUtc: row.dayUtc.toISOString(),          // string
      pointsEarned: row.pointsEarned ?? 0,
      uptimePct: row.uptimePct ?? 0,            // 0–100
      avgBandwidthMbps: row.avgBandwidth ?? 0,  // Mbps
      qfScore: row.qfScore ?? 0,
      trustScore: row.trustScore ?? 0,
    }));

    return NextResponse.json(
      {
        ok: true,
        userId,
        days,
        data,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[GET /api/dashboard/daily] error", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to load daily metrics",
      },
      { status: 500 }
    );
  }
}
