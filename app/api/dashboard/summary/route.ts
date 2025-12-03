// app/api/dashboard/summary/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { DashboardRange } from "@/types/dashboard";

/**
 * GET /api/dashboard/summary?range=today|7d|30d
 *
 * ใช้เป็น source หลักของ KPI บน Dashboard:
 *  - Points Today
 *  - Total Points
 *  - SLK (off-chain)
 *  - Uptime Today (ชั่วโมง)
 *  - Goal Hours (ตั้งค่าตายตัว 8 ชม. ตอนนี้)
 *  - Avg Bandwidth (Mbps)
 *  - QF Score / Trust Score
 *  - Region / IP / Version ล่าสุดของ node
 *
 * ฝั่ง client ใช้ helper fetchDashboardSummaryClient() ซึ่งรองรับทั้ง:
 *  - { ok: true, summary: {...} }
 *  - หรือ { pointsToday, totalPoints, ... } ตรง ๆ
 */

const DEFAULT_GOAL_HOURS = 8;

function truncateToDayUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get("range") as DashboardRange | null;
    const range: DashboardRange = rangeParam === "7d" || rangeParam === "30d" ? rangeParam : "today";

    const cookieStore = cookies();
    const wallet = cookieStore.get("solink_wallet")?.value ?? null;

    // ถ้ายังไม่ login ด้วย wallet → ส่ง summary ว่าง ๆ กลับไป
    if (!wallet) {
      const empty = {
        pointsToday: 0,
        totalPoints: 0,
        slk: 0,
        uptimeHours: 0,
        goalHours: DEFAULT_GOAL_HOURS,
        avgBandwidthMbps: 0,
        qf: 0,
        trust: 0,
        region: null as string | null,
        ip: null as string | null,
        version: null as string | null,
      };

      return NextResponse.json(
        {
          ok: true,
          summary: empty,
          ...empty,
        },
        { status: 200 }
      );
    }

    // หา user จาก wallet
    const user = await prisma.user.findFirst({
      where: { wallet },
    });

    if (!user) {
      const empty = {
        pointsToday: 0,
        totalPoints: 0,
        slk: 0,
        uptimeHours: 0,
        goalHours: DEFAULT_GOAL_HOURS,
        avgBandwidthMbps: 0,
        qf: 0,
        trust: 0,
        region: null as string | null,
        ip: null as string | null,
        version: null as string | null,
      };

      return NextResponse.json(
        {
          ok: true,
          summary: empty,
          ...empty,
        },
        { status: 200 }
      );
    }

    const now = new Date();
    const todayUtc = truncateToDayUtc(now);

    // ใช้ Promise.all ให้เร็วที่สุด
    const [todayMetrics, balance, latestHourly] = await Promise.all([
      // MetricsDaily วันนี้ของ user
      prisma.metricsDaily.findUnique({
        where: {
          dayUtc_userId_unique: {
            dayUtc: todayUtc,
            userId: user.id,
          },
        },
      }),
      // PointBalance ปัจจุบัน
      prisma.pointBalance.findUnique({
        where: { userId: user.id },
      }),
      // ใช้ MetricsHourly แถวล่าสุดของ user (เอา region / ip / version)
      prisma.metricsHourly.findFirst({
        where: { userId: user.id },
        orderBy: { hourUtc: "desc" },
      }),
    ]);

    const pointsToday = todayMetrics?.pointsEarned ?? 0;
    const totalPoints = balance?.balance ?? 0;
    const slk = balance?.slk ?? 0;

    // แปล uptimePct → uptimeHours แบบคร่าว ๆ (จาก daily row วันนี้)
    const uptimePct = todayMetrics?.uptimePct ?? null;
    const uptimeHours =
      uptimePct != null && Number.isFinite(uptimePct) ? Math.round((uptimePct / 100) * 24) : 0;

    const avgBandwidthMbps = todayMetrics?.avgBandwidth ?? 0;
    const qf = todayMetrics?.qfScore ?? 0;
    const trust = todayMetrics?.trustScore ?? 0;

    const region = latestHourly?.region ?? todayMetrics?.region ?? null;
    const ip = latestHourly?.ip ?? todayMetrics?.ip ?? null;
    const version = latestHourly?.version ?? todayMetrics?.version ?? null;

    const summary = {
      pointsToday,
      totalPoints,
      slk,
      uptimeHours,
      goalHours: DEFAULT_GOAL_HOURS,
      avgBandwidthMbps,
      qf,
      trust,
      region,
      ip,
      version,
    };

    return NextResponse.json(
      {
        ok: true,
        range,
        summary,
        // duplicate fields เผื่อ client รุ่นเก่า
        ...summary,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("/api/dashboard/summary error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
