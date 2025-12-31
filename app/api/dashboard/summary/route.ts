// app/api/dashboard/summary/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function startOfUtcHour(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), 0, 0, 0)
  );
}

function rangeToDays(range: string) {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  return 1; // today
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const range = (url.searchParams.get("range") || "today").toLowerCase();

    const cookieStore = cookies();
    const auth = cookieStore.get("solink_auth")?.value;
    const wallet = cookieStore.get("solink_wallet")?.value?.trim();

    if (!auth || !wallet) {
      return NextResponse.json(
        {
          ok: false,
          error: "Not authenticated",
          summary: {
            pointsToday: 0,
            totalPoints: 0,
            slk: 0,
            uptimeHours: 0,
            goalHours: 8,
            avgBandwidthMbps: 0,
            qf: 0,
            trust: 0,
            region: null,
            ip: null,
            version: null,
          },
        },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const user = await prisma.user.findFirst({ where: { wallet } });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const now = new Date();
    const dayStart = startOfUtcDay(now);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const days = rangeToDays(range);
    const rangeStart =
      range === "today"
        ? dayStart
        : new Date(startOfUtcDay(now).getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    // --------------------------
    // pointsToday (UTC today) จาก PointEvent
    // --------------------------
    const pointsTodayAgg = await prisma.pointEvent.aggregate({
      where: {
        userId: user.id,
        occurredAt: { gte: dayStart, lt: dayEnd },
      },
      _sum: { amount: true },
    });
    const pointsToday = pointsTodayAgg._sum.amount ?? 0;

    // --------------------------
    // totalPoints + slk จาก PointBalance (ถ้ามี)
    // --------------------------
    const bal = await prisma.pointBalance.findUnique({
      where: { userId: user.id },
      select: { balance: true, slk: true },
    });

    const totalPoints = bal?.balance ?? 0;
    const slk = bal?.slk ?? 0;

    // --------------------------
    // avgBandwidthMbps
    // today: ใช้ MetricsHourly ชั่วโมงปัจจุบัน -> fallback เฉลี่ยในวัน
    // 7d/30d: เฉลี่ย MetricsDaily.avgBandwidth
    // --------------------------
    let avgBandwidthMbps = 0;

    if (range === "today") {
      const hourUtc = startOfUtcHour(now);

      const mh = await prisma.metricsHourly.findUnique({
        where: {
          hourUtc_userId_unique: {
            hourUtc,
            userId: user.id,
          },
        },
        select: { avgBandwidth: true },
      });

      if (mh?.avgBandwidth != null && Number.isFinite(mh.avgBandwidth)) {
        avgBandwidthMbps = mh.avgBandwidth;
      } else {
        const mhList = await prisma.metricsHourly.findMany({
          where: {
            userId: user.id,
            hourUtc: { gte: dayStart, lt: dayEnd },
            avgBandwidth: { not: null },
          },
          select: { avgBandwidth: true },
          orderBy: { hourUtc: "desc" },
          take: 24,
        });

        if (mhList.length) {
          const nums = mhList
            .map((x) => x.avgBandwidth)
            .filter((x): x is number => typeof x === "number" && Number.isFinite(x));
          if (nums.length) {
            avgBandwidthMbps = nums.reduce((a, b) => a + b, 0) / nums.length;
          }
        }
      }
    } else {
      const md = await prisma.metricsDaily.findMany({
        where: {
          userId: user.id,
          dayUtc: { gte: rangeStart, lt: dayEnd },
          avgBandwidth: { not: null },
        },
        select: { avgBandwidth: true },
        orderBy: { dayUtc: "desc" },
        take: days,
      });

      if (md.length) {
        const nums = md
          .map((x) => x.avgBandwidth)
          .filter((x): x is number => typeof x === "number" && Number.isFinite(x));
        if (nums.length) {
          avgBandwidthMbps = nums.reduce((a, b) => a + b, 0) / nums.length;
        }
      }
    }

    // --------------------------
    // uptimeHours (เดิมของคุณ)
    // --------------------------
    const goalHours = 8;

    const uptimeAgg = await prisma.pointEvent.aggregate({
      where: {
        userId: user.id,
        type: "UPTIME_MINUTE",
        occurredAt: { gte: dayStart, lt: dayEnd },
      },
      _sum: { amount: true },
    });

    const uptimeMinutes = uptimeAgg._sum.amount ?? 0;
    const uptimeHours = uptimeMinutes / 60;

    // --------------------------
    // ✅ qf / trust / region / version
    // - prefer: MetricsDaily ของ "วันนี้"
    // - fallback: trust จาก Node.trustScore (0..1 -> 0..100)
    // - fallback qf: สูตรเบาๆ จาก uptimePct + avgBandwidth
    // --------------------------
    const mdToday = await prisma.metricsDaily.findUnique({
      where: {
        dayUtc_userId_unique: {
          dayUtc: dayStart,
          userId: user.id,
        },
      },
      select: {
        uptimePct: true,
        qfScore: true,
        trustScore: true,
        region: true,
        version: true,
        avgBandwidth: true,
      },
    });

    const node = await prisma.node.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { region: true, trustScore: true },
    });

    const uptimePct = Number(mdToday?.uptimePct ?? 0);
    const trustFromNode = node?.trustScore != null ? Number(node.trustScore) * 100 : 0;

    const trust = clamp(
      Math.round(Number(mdToday?.trustScore ?? trustFromNode ?? 0)),
      0,
      100
    );

    // ถ้า metricsDaily.avgBandwidth มีค่า จะใช้มันเป็นฐาน QF ก่อน (เผื่อ summary avg เป็นคนละสูตร)
    const bwForQf = Number(
      mdToday?.avgBandwidth != null && Number.isFinite(mdToday.avgBandwidth)
        ? mdToday.avgBandwidth
        : avgBandwidthMbps
    );

    const qfFallback = clamp(
      Math.round(uptimePct * 0.6 + clamp(bwForQf, 0, 100) * 0.4),
      0,
      100
    );

    const qf = clamp(Math.round(Number(mdToday?.qfScore ?? qfFallback ?? 0)), 0, 100);

    const region = mdToday?.region ?? node?.region ?? null;
    const version = mdToday?.version ?? null;

    // ip จาก headers (proxy friendly)
    const h = headers();
    const ip =
      (h.get("x-forwarded-for")?.split(",")?.[0]?.trim() ?? null) || (h.get("x-real-ip") ?? null);

    return NextResponse.json(
      {
        ok: true,
        range,
        summary: {
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
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("[dashboard/summary] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
