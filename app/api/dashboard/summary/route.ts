// app/api/dashboard/summary/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { DashboardRange } from "@/types/dashboard";

const DEFAULT_GOAL_HOURS = 8;
// ต้องตรงกับค่าที่ใช้ใน /api/sharing/heartbeat
const HEARTBEAT_UPTIME_SEC = 60;

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
      ip: null as string | null,
      version: null as string | null,
    });

    // ยังไม่ได้ login ด้วย wallet
    if (!wallet) {
      const empty = makeEmpty();
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
      const empty = makeEmpty();
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

    // ดึงข้อมูลหลักสำหรับ summary
    const [eventsToday, balance, latestHourly] = await Promise.all([
      prisma.pointEvent.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: todayUtc,
            lt: tomorrowUtc,
          },
        },
      }),
      prisma.pointBalance.findUnique({
        where: { userId: user.id },
      }),
      prisma.metricsHourly.findFirst({
        where: { userId: user.id },
        orderBy: { hourUtc: "desc" },
      }),
    ]);

    // 1) คะแนนวันนี้
    const pointsToday = eventsToday.reduce((sum, e) => sum + e.amount, 0);

    // 2) ยอดสะสม / SLK
    const totalPoints = balance?.balance ?? 0;
    const slk = balance?.slk ?? 0;

    // 3) Uptime วันนี้ (ชั่วโมง)
    const heartbeatCount = eventsToday.filter((e) => e.type === "extension_farm").length;
    const uptimeSecTotal = heartbeatCount * HEARTBEAT_UPTIME_SEC;
    const uptimeHours = Math.round(uptimeSecTotal / 3600);

    // 4) Average Bandwidth (Mbps)
    let avgBandwidthMbps = 0;
    const bandwidthSamples: number[] = [];

    for (const ev of eventsToday) {
      const meta: any = ev.meta as any;
      if (meta && typeof meta.bandwidthMbps === "number" && meta.bandwidthMbps > 0) {
        bandwidthSamples.push(meta.bandwidthMbps);
      }
    }

    if (bandwidthSamples.length > 0) {
      const sum = bandwidthSamples.reduce((s, v) => s + v, 0);
      avgBandwidthMbps = Math.round((sum / bandwidthSamples.length) * 10) / 10;
    }

    // 5) คำนวณ Quality Factor จาก uptime+bandwidth ของวันนี้
    const goalHours = DEFAULT_GOAL_HOURS;
    const uptimePctToday = goalHours > 0 ? (uptimeHours / goalHours) * 100 : 0;

    // uptime 70 คะแนน (เต็มที่ 80%)
    const uptimeScoreQF = clamp01(uptimePctToday / 80) * 70;
    // bandwidth 30 คะแนน (10–100 Mbps)
    const bwScoreQF = clamp01((avgBandwidthMbps - 10) / (100 - 10)) * 30;

    const qf = Math.round(uptimeScoreQF + bwScoreQF);

    // 6) คำนวณ Trust Score แบบง่าย ๆ
    // uptime วันนี้ 60 คะแนน (เต็มที่ 95%)
    const uptimeScoreTrust = clamp01(uptimePctToday / 95) * 60;
    // ความ active จากแต้มวันนี้ (>= 500 แต้ม = เต็ม 30)
    const activityScore = clamp01(pointsToday / 500) * 30;
    // อายุบัญชี (30 วัน = เต็ม 10)
    const accountAgeDays = Math.floor(
      (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const ageScore = clamp01(accountAgeDays / 30) * 10;

    const trust = Math.round(uptimeScoreTrust + activityScore + ageScore);

    // 7) Region / IP / Version
    const region = latestHourly?.region ?? null;
    const ip = latestHourly?.ip ?? null;
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
      ip,
      version,
    };

    return NextResponse.json(
      {
        ok: true,
        range,
        summary,
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
