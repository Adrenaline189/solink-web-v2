// app/api/dashboard/summary/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { DashboardRange } from "@/types/dashboard";
import { getRangeBounds } from "@/lib/dashboard-range";

const DEFAULT_GOAL_HOURS = 8;

// สำหรับ UPTIME_MINUTE: 1 event = 60 sec
const UPTIME_MINUTE_SEC = 60;

// helper
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

    // ยังไม่ได้ login
    if (!wallet) {
      const empty = makeEmpty();
      return NextResponse.json({ ok: true, range, summary: empty, ...empty });
    }

    // หา user จาก wallet
    const user = await prisma.user.findFirst({ where: { wallet } });
    if (!user) {
      const empty = makeEmpty();
      return NextResponse.json({ ok: true, range, summary: empty, ...empty });
    }

    const now = new Date();
    const { startUtc, endUtc } = getRangeBounds(range);

    // ดึง:
    // - balance ยอดรวม
    // - latestHourly ไว้โชว์ region/ip/version
    // - metricsDaily ของวัน "วันนี้" (UTC) สำหรับ pointsToday
    // - events ในช่วงวันนี้ เพื่อคำนวณ uptime/bandwidth แบบละเอียด (ใช้ occurredAt)
    const [balance, latestHourly, todayDaily, eventsInRange] = await Promise.all([
      prisma.pointBalance.findUnique({ where: { userId: user.id } }),

      prisma.metricsHourly.findFirst({
        where: { userId: user.id },
        orderBy: { hourUtc: "desc" },
      }),

      prisma.metricsDaily.findFirst({
        where: {
          userId: user.id,
          dayUtc: startUtc, // สำหรับ range=today, startUtc คือ 00:00 UTC ของวันนี้
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.pointEvent.findMany({
        where: {
          userId: user.id,
          occurredAt: { gte: startUtc, lt: endUtc },
        },
        select: {
          type: true,
          amount: true,
          meta: true,
          occurredAt: true,
        },
      }),
    ]);

    // 1) pointsToday:
    // - ถ้า range=today ใช้ MetricsDaily (แม่น/เร็ว)
    // - fallback ถ้าไม่มี row ค่อย sum จาก eventsInRange
    const pointsToday =
      range === "today"
        ? (todayDaily?.pointsEarned ?? eventsInRange.reduce((s, e) => s + (e.amount ?? 0), 0))
        : 0;

    // 2) totalPoints / slk
    const totalPoints = balance?.balance ?? 0;
    const slk = balance?.slk ?? 0;

    // 3) uptimeHours:
    // รองรับ 2 type:
    // - ใหม่: UPTIME_MINUTE (1 แต้ม/ครั้ง จาก sharing)
    // - เดิม: extension_farm (10 แต้ม/ครั้ง บางระบบเก่า) => นับเป็น 60 sec/ครั้งเหมือนกัน
    const uptimeEventsCount = eventsInRange.filter(
      (e) => e.type === "UPTIME_MINUTE" || e.type === "extension_farm"
    ).length;

    const uptimeSecTotal = uptimeEventsCount * UPTIME_MINUTE_SEC;
    const uptimeHours = Math.round(uptimeSecTotal / 3600);

    // 4) avgBandwidthMbps: เก็บจาก meta.bandwidthMbps (ถ้ามี)
    let avgBandwidthMbps = 0;
    const bandwidthSamples: number[] = [];

    for (const ev of eventsInRange) {
      const meta: any = ev.meta as any;
      if (meta && typeof meta.bandwidthMbps === "number" && meta.bandwidthMbps > 0) {
        bandwidthSamples.push(meta.bandwidthMbps);
      }
    }

    if (bandwidthSamples.length > 0) {
      const sum = bandwidthSamples.reduce((s, v) => s + v, 0);
      avgBandwidthMbps = Math.round((sum / bandwidthSamples.length) * 10) / 10;
    }

    // 5) QF (วันนี้) จาก uptime + bandwidth
    const goalHours = DEFAULT_GOAL_HOURS;
    const uptimePctToday = goalHours > 0 ? (uptimeHours / goalHours) * 100 : 0;

    const uptimeScoreQF = clamp01(uptimePctToday / 80) * 70;
    const bwScoreQF = clamp01((avgBandwidthMbps - 10) / (100 - 10)) * 30;
    const qf = Math.round(uptimeScoreQF + bwScoreQF);

    // 6) Trust Score แบบง่าย
    const uptimeScoreTrust = clamp01(uptimePctToday / 95) * 60;

    // “activityScore” ใช้แต้มในช่วง range (ถ้า today ใช้ pointsToday)
    const pointsInRange = eventsInRange.reduce((s, e) => s + (e.amount ?? 0), 0);
    const activityBase = range === "today" ? pointsToday : pointsInRange;

    const activityScore = clamp01(activityBase / 500) * 30;

    const accountAgeDays = Math.floor(
      (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const ageScore = clamp01(accountAgeDays / 30) * 10;

    const trust = Math.round(uptimeScoreTrust + activityScore + ageScore);

    // 7) Region / IP / Version (อิง latestHourly)
    const region = (latestHourly as any)?.region ?? null;
    const ip = (latestHourly as any)?.ip ?? null;
    const version = (latestHourly as any)?.version ?? null;

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

    return NextResponse.json({ ok: true, range, summary, ...summary });
  } catch (e: any) {
    console.error("/api/dashboard/summary error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
