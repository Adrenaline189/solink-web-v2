import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const POINTS_PER_HEARTBEAT = 10;   // แต้มต่อ 1 heartbeat
const DEFAULT_UPTIME_SEC = 60;     // สมมติว่า 1 heartbeat = 60 วินาที

// ปัดเวลาให้เป็นต้นชั่วโมงแบบ UTC เช่น 2025-12-02T14:00:00Z
function floorToUtcHour(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      0,
      0,
      0
    )
  );
}

// ปัดเวลาให้เป็นต้นวัน UTC เช่น 2025-12-02T00:00:00Z
function floorToUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
}

/**
 * POST /api/sharing/heartbeat
 *
 * ใช้ตอน Sharing = Active เพื่อ:
 *  - สร้าง PointEvent type = "extension_farm"
 *  - อัปเดต PointBalance.balance
 *  - อัปเดต MetricsHourly / MetricsDaily ของ user (สำหรับกราฟ)
 *
 * body (optional):
 *   {
 *     bandwidthMbps?: number;
 *     uptimeSec?: number;
 *   }
 *
 * auth:
 *   - ต้องมี cookie `solink_auth` + `solink_wallet`
 */
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();

    const auth = cookieStore.get("solink_auth")?.value;
    const wallet = cookieStore.get("solink_wallet")?.value;

    if (!auth || !wallet) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // body: optional metrics จาก client
    const body = (await req.json().catch(() => ({}))) as {
      bandwidthMbps?: number;
      uptimeSec?: number;
    };

    const bandwidthMbps = Number.isFinite(body.bandwidthMbps)
      ? Math.max(0, Number(body.bandwidthMbps))
      : 0;

    const uptimeSecRaw = Number.isFinite(body.uptimeSec)
      ? Math.max(0, Number(body.uptimeSec))
      : DEFAULT_UPTIME_SEC;

    // จำกัด uptime ต่อ heartbeat ไม่เกิน 1 ชม.
    const uptimeSec = Math.min(uptimeSecRaw, 3600);

    // หา / สร้าง user จาก wallet
    let user = await prisma.user.findUnique({
      where: { wallet },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { wallet },
      });
    }

    const now = new Date();
    const hourUtc = floorToUtcHour(now);
    const dayUtc = floorToUtcDay(now);
    const pointsPerHeartbeat = POINTS_PER_HEARTBEAT;

    // ===== สำคัญ: dedupeKey ต่อ 1 user ต่อ 1 นาที =====
    const minuteUtc = new Date(now);
    minuteUtc.setUTCSeconds(0, 0);
    const dedupeKey = `sharing-heartbeat:${user.id}:${minuteUtc.toISOString()}`;

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1) log ลง PointEvent (ledger)
      const event = await tx.pointEvent.create({
        data: {
          userId: user.id,
          type: "extension_farm",
          amount: pointsPerHeartbeat,

          // ✅ required fields ตาม schema
          source: "sharing",
          ruleVersion: "v1",
          dedupeKey,
          occurredAt: now,

          meta: {
            source: "heartbeat",
            uptimeSec,
            bandwidthMbps,
          },
        },
      });

      // 2) upsert PointBalance
      const balance = await tx.pointBalance.upsert({
        where: { userId: user.id },
        update: {
          balance: { increment: pointsPerHeartbeat },
        },
        create: {
          userId: user.id,
          balance: pointsPerHeartbeat,
          slk: 0,
        },
      });

      // 3) อัปเดต MetricsHourly (per user)
      await tx.metricsHourly.upsert({
        where: {
          hourUtc_userId_unique: {
            hourUtc,
            userId: user.id,
          },
        },
        update: {
          pointsEarned: { increment: pointsPerHeartbeat },
          avgBandwidth: bandwidthMbps || undefined,
        },
        create: {
          hourUtc,
          userId: user.id,
          pointsEarned: pointsPerHeartbeat,
          uptimePct: null,
          avgBandwidth: bandwidthMbps || null,
          qfScore: null,
          trustScore: null,
          region: null,
          version: null,
        },
      });

      // 4) อัปเดต MetricsDaily (per user)
      await tx.metricsDaily.upsert({
        where: {
          dayUtc_userId_unique: {
            dayUtc,
            userId: user.id,
          },
        },
        update: {
          pointsEarned: { increment: pointsPerHeartbeat },
        },
        create: {
          dayUtc,
          userId: user.id,
          pointsEarned: pointsPerHeartbeat,
          uptimePct: null,
          avgBandwidth: bandwidthMbps || null,
          qfScore: null,
          trustScore: null,
          region: null,
          version: null,
        },
      });

      return { event, balance };
    });

    return NextResponse.json(
      {
        ok: true,
        pointsEarned: pointsPerHeartbeat,
        totalBalance: result.balance.balance,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[sharing/heartbeat] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
