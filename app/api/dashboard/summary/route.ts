import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { DashboardRange } from "@/types/dashboard";

const DEFAULT_GOAL_HOURS = 8;

// helper
function truncateToDayUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get("range") as DashboardRange | null;
    const range: DashboardRange =
      rangeParam === "7d" || rangeParam === "30d" ? rangeParam : "today";

    const cookieStore = cookies();
    const wallet = cookieStore.get("solink_wallet")?.value ?? null;

    const makeEmpty = () => ({
      pointsToday: 0,
      totalPoints: 0,
      slk: 0,
      uptimeHours: 0,
      goalHours: DEFAULT_GOAL_HOURS,
      avgBandwidthMbps: 0,
      qf: 0,
      trust: 0,
      region: null as string | null,
      ip: null as string | null, // schema ไม่มี ip ใน MetricsHourly ตอนนี้ → คืน null เสมอ
      version: null as string | null,
    });

    // ยังไม่ได้ login ด้วย wallet
    if (!wallet) {
      const empty = makeEmpty();
      return NextResponse.json({ ok: true, range, summary: empty, ...empty }, { status: 200 });
    }

    // หา user จาก wallet
    const user = await prisma.user.findFirst({ where: { wallet } });

    if (!user) {
      const empty = makeEmpty();
      return NextResponse.json({ ok: true, range, summary: empty, ...empty }, { status: 200 });
    }

    const now = new Date();
    const todayUtc = truncateToDayUtc(now);
    const tomorrowUtc = new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000);

    // ดึงข้อมูลจาก metrics เป็นหลัก
    const [dailyToday, balance, latestHourly] = await Promise.all([
      prisma.metricsDaily.findUnique({
        where: {
          dayUtc_userId_unique: { dayUtc: todayUtc, userId: user.id },
        },
      }),
      prisma.pointBalance.findUnique({ where: { userId: user.id } }),
      prisma.metricsHourly.findFirst({
        where: { userId: user.id },
        orderBy: { hourUtc: "desc" },
      }),
    ]);

    const goalHours = DEFAULT_GOAL_HOURS;

    // 1) คะแนนวันนี้: ใช้ MetricsDaily ก่อน (fallback: sum PointEvent ของวันนั้น)
    let pointsToday = dailyToday?.pointsEarned ?? 0;

    if (!dailyToday) {
      const sumEvents = await prisma.pointEvent.aggregate({
        where: {
          userId: user.id,
          occurredAt: { gte: todayUtc, lt: tomorrowUtc }, // ใช้ occurredAt ให้ตรงระบบใหม่
        },
        _sum: { amount: true },
      });
      pointsToday = sumEvents._sum.amount ?? 0;
    }

    // 2) ยอดสะสม / SLK (real-time)
    const totalPoints = balance?.balance ?? 0;
    const slk = balance?.slk ?? 0;

    // 3) Uptime วันนี้ (ชั่วโมง)
    // - ถ้า MetricsDaily.uptimePct มี → คิดชั่วโมงจาก goalHours
    // - ไม่งั้น fallback: นับ event UPTIME_MINUTE ของวันนี้ (occurredAt)
    let uptimeHours = 0;

    if (dailyToday?.uptimePct != null && goalHours > 0) {
      uptimeHours = Math.round((dailyToday.uptimePct / 100) * goalHours);
    } else {
      const uptimeCount = await prisma.pointEvent.count({
        where: {
          userId: user.id,
          type: "UPTIME_MINUTE",
          occurredAt: { gte: todayUtc, lt: tomorrowUtc },
        },
      });
      // 1 นาทีต่อ event → ชั่วโมง
      uptimeHours = Math.round(uptimeCount / 60);
    }

    // 4) Average Bandwidth (Mbps): ใช้ MetricsDaily ก่อน (ถ้าไม่มีให้เป็น 0)
    const avgBandwidthMbps =
      dailyToday?.avgBandwidth != null ? Math.round(dailyToday.avgBandwidth * 10) / 10 : 0;

    // 5) QF / Trust: ใช้ MetricsDaily ก่อน (ถ้าไม่มีค่อยคำนวณแบบง่าย)
    let qf = dailyToday?.qfScore != null ? Math.round(dailyToday.qfScore) : 0;
    let trust = dailyToday?.trustScore != null ? Math.round(dailyToday.trustScore) : 0;

    if (dailyToday?.qfScore == null || dailyToday?.trustScore == null) {
      const uptimePctToday = goalHours > 0 ? (uptimeHours / goalHours) * 100 : 0;

      // QF: uptime 70 (เต็มที่ 80%), bandwidth 30 (10–100 Mbps)
      const uptimeScoreQF = clamp01(uptimePctToday / 80) * 70;
      const bwScoreQF = clamp01((avgBandwidthMbps - 10) / (100 - 10)) * 30;
      qf = Math.round(uptimeScoreQF + bwScoreQF);

      // Trust: uptime 60 (เต็มที่ 95%), activity 30 (>=500 แต้ม), age 10 (30 วัน)
      const uptimeScoreTrust = clamp01(uptimePctToday / 95) * 60;
      const activityScore = clamp01(pointsToday / 500) * 30;

      const accountAgeDays = Math.floor(
        (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const ageScore = clamp01(accountAgeDays / 30) * 10;

      trust = Math.round(uptimeScoreTrust + activityScore + ageScore);
    }

    // 6) Region / Version (จาก hourly ล่าสุด)
    const region = latestHourly?.region ?? null;
    const version = latestHourly?.version ?? null;

    const summary = {
      pointsToday,
      totalPoints,
      slk,
      uptimeHours,
      goalHours,
      avgBandwidthMbps,
      qf,
      trust,
      region,
      ip: null as string | null, // schema ไม่มี field ip ตอนนี้
      version,
    };

    return NextResponse.json({ ok: true, range, summary, ...summary }, { status: 200 });
  } catch (e: any) {
    console.error("/api/dashboard/summary error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Internal server error" }, { status: 500 });
  }
}
