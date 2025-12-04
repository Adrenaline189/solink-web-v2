// app/api/dashboard/summary/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { DashboardRange } from "@/types/dashboard";

/**
 * GET /api/dashboard/summary?range=today|7d|30d
 */

const DEFAULT_GOAL_HOURS = 8;

function truncateToDayUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get("range") as DashboardRange | null;
    const range: DashboardRange =
      rangeParam === "7d" || rangeParam === "30d" ? rangeParam : "today";

    const cookieStore = cookies();
    const wallet = cookieStore.get("solink_wallet")?.value ?? null;

    // ยังไม่ login → ส่ง summary ว่าง ๆ
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
          range,
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
          range,
          summary: empty,
          ...empty,
        },
        { status: 200 }
      );
    }

    const now = new Date();
    const todayUtc = truncateToDayUtc(now);
    const tomorrowUtc = new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000);

    // ใช้ Promise.all ให้เร็ว
    const [todayMetrics, balance, latestHourly, todayEventsAgg] = await Promise.all([
      // MetricsDaily วันนี้ของ user (อาจยังไม่มี)
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
      // fallback: นับแต้มวันนี้จาก PointEvent โดยตรง
      prisma.pointEvent.aggregate({
        where: {
          userId: user.id,
          createdAt: {
            gte: todayUtc,
            lt: tomorrowUtc,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    // ==== แต้ม & SLK ====
    const pointsTodayFromDaily =
      typeof todayMetrics?.pointsEarned === "number"
        ? todayMetrics.pointsEarned
        : null;

    const pointsTodayFromEvents = todayEventsAgg._sum.amount ?? 0;

    // ถ้ามี MetricsDaily ใช้ค่านั้นก่อน ถ้าไม่มีค่อย fallback ไปใช้ aggregate จาก PointEvent
    const pointsToday =
      pointsTodayFromDaily != null ? pointsTodayFromDaily : pointsTodayFromEvents;

    const totalPoints = balance?.balance ?? 0;
    const slk = balance?.slk ?? 0;

    // ==== Uptime ====
    const uptimePct = todayMetrics?.uptimePct ?? null;
    const uptimeHours =
      uptimePct != null && Number.isFinite(uptimePct)
        ? Math.round((uptimePct / 100) * 24)
        : 0;

    // ==== bandwidth / scores ====
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
