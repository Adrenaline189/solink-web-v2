// app/api/dashboard/summary/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { DashboardRange } from "@/types/dashboard";

const DEFAULT_GOAL_HOURS = 8;
// ต้องตรงกับค่าที่ใช้ใน /api/sharing/heartbeat
const HEARTBEAT_UPTIME_SEC = 60;

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

    // ยังไม่ได้ login ด้วย wallet → ส่ง summary ว่าง ๆ
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

    // ----------------------------------------------------
    // ดึงข้อมูลหลักสำหรับ summary:
    //  - PointEvent วันนี้ของ user
    //  - PointBalance ตอนนี้
    //  - MetricsHourly แถวล่าสุดเอา region/ip/version
    // ----------------------------------------------------
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

    // 1) คะแนนวันนี้จาก PointEvent (ทุก type รวมกัน)
    const pointsToday = eventsToday.reduce((sum, e) => sum + e.amount, 0);

    // 2) ยอดสะสม / SLK จาก PointBalance
    const totalPoints = balance?.balance ?? 0;
    const slk = balance?.slk ?? 0;

    // 3) Uptime วันนี้ (ชั่วโมง) — คิดจากจำนวน heartbeat วันนี้
    //    โดยสมมติว่า heartbeat หนึ่งครั้งแทน 60 วินาที
    const heartbeatCount = eventsToday.filter((e) => e.type === "extension_farm").length;
    const uptimeSecTotal = heartbeatCount * HEARTBEAT_UPTIME_SEC;
    const uptimeHours = Math.round(uptimeSecTotal / 3600);

    // 4) Average Bandwidth (Mbps) — เฉลี่ยจาก meta.bandwidthMbps ของ event วันนี้
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
      avgBandwidthMbps = Math.round((sum / bandwidthSamples.length) * 10) / 10; // ปัดทศนิยม 1 ตำแหน่ง
    }

    // 5) QF / Trust ตอนนี้ยังไม่มีสูตร → ให้ 0 ไปก่อน
    const qf = 0;
    const trust = 0;

    // 6) Region / IP / Version ดึงจาก metricsHourly แถวล่าสุด
    const region = latestHourly?.region ?? null;
    const ip = latestHourly?.ip ?? null;
    const version = latestHourly?.version ?? null;

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
        ...summary, // เผื่อ client รุ่นเก่า
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
