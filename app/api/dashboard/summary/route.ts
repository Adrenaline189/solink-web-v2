// app/api/dashboard/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

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

// ✅ นับเฉพาะ “แต้มที่ได้” (ไม่รวม convert_debit / debit อื่น ๆ)
const EARN_TYPES = ["extension_farm", "UPTIME_MINUTE", "referral", "referral_bonus"] as const;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const range = (url.searchParams.get("range") || "today").toLowerCase();

    // ✅ auth จาก cookie solink_auth (JWT)
    const ctx = await getAuthContext(req);
    if (!ctx?.wallet) {
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

    // ✅ หา user ก่อน แล้วใช้ user.id (กัน FK / กัน mismatch)
    const user = await prisma.user.findFirst({ where: { wallet: ctx.wallet } });
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
    // ✅ pointsToday (UTC today) = earned only (ไม่รวม debit)
    // --------------------------
    const pointsTodayAgg = await prisma.pointEvent.aggregate({
      where: {
        userId: user.id,
        occurredAt: { gte: dayStart, lt: dayEnd },
        type: { in: [...EARN_TYPES] },
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    });

    const pointsTodayRaw = pointsTodayAgg._sum.amount ?? 0;
    const pointsToday = Number.isFinite(pointsTodayRaw) ? Math.max(0, pointsTodayRaw) : 0;

    // --------------------------
    // totalPoints + slk จาก PointBalance
    // --------------------------
    const bal = await prisma.pointBalance.findUnique({
      where: { userId: user.id },
      select: { balance: true, slk: true },
    });

    const totalPoints = Math.max(0, Number(bal?.balance ?? 0));
    const slk = Math.max(0, Number(bal?.slk ?? 0));

    // --------------------------
    // avgBandwidthMbps
    // today: MetricsHourly ชั่วโมงปัจจุบัน -> fallback เฉลี่ยในวัน
    // 7d/30d: เฉลี่ยจาก MetricsDaily.avgBandwidth
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

        const nums = mhList
          .map((x) => x.avgBandwidth)
          .filter((x): x is number => typeof x === "number" && Number.isFinite(x));

        if (nums.length) {
          avgBandwidthMbps = nums.reduce((a, b) => a + b, 0) / nums.length;
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

      const nums = md
        .map((x) => x.avgBandwidth)
        .filter((x): x is number => typeof x === "number" && Number.isFinite(x));

      if (nums.length) {
        avgBandwidthMbps = nums.reduce((a, b) => a + b, 0) / nums.length;
      }
    }

    // --------------------------
    // uptimeHours
    // --------------------------
    const goalHours = 8;

    const uptimeAgg = await prisma.pointEvent.aggregate({
      where: {
        userId: user.id,
        type: "UPTIME_MINUTE",
        occurredAt: { gte: dayStart, lt: dayEnd },
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    });

    const uptimeMinutesRaw = uptimeAgg._sum.amount ?? 0;
    const uptimeMinutes = Number.isFinite(uptimeMinutesRaw) ? Math.max(0, uptimeMinutesRaw) : 0;
    const uptimeHours = uptimeMinutes / 60;

    // --------------------------
    // qf / trust / region / version
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

    const uptimePct = Number.isFinite(Number(mdToday?.uptimePct ?? 0))
      ? Number(mdToday?.uptimePct ?? 0)
      : 0;

    const trustFromNode =
      node?.trustScore != null && Number.isFinite(Number(node.trustScore))
        ? Number(node.trustScore) * 100
        : 0;

    const trust = clamp(
      Math.round(Number(mdToday?.trustScore ?? trustFromNode ?? 0)),
      0,
      100
    );

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

    // ip จาก headers
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
