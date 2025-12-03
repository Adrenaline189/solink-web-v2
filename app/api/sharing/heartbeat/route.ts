// app/api/sharing/heartbeat/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// แต้มต่อ 1 heartbeat และ uptime ดีฟอลต์
const POINTS_PER_HEARTBEAT = 10; // 1 heartbeat = 10 pts (ตัวอย่าง)
const DEFAULT_UPTIME_SEC = 60;   // สมมติส่งทุก ๆ 60 วินาที

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

/**
 * POST /api/sharing/heartbeat
 *
 * ใช้ให้ client ยิงทุก ๆ 60 วินาที เพื่อ:
 *  - บันทึก PointEvent type="extension_farm"
 *  - อัปเดต MetricsHourly ของ user
 *  - อัปเดต MetricsHourly แถว system (userId = null)
 *
 * body:
 * {
 *   "wallet": string,
 *   "bandwidthMbps"?: number,
 *   "uptimeSec"?: number
 * }
 */
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const auth = cookieStore.get("solink_auth")?.value;
    const walletCookie = cookieStore.get("solink_wallet")?.value;

    // 1) parse body
    const body = await req.json().catch(() => null);

    const wallet: string | undefined =
      body?.wallet || walletCookie || undefined;
    const bandwidthMbps: number | undefined =
      typeof body?.bandwidthMbps === "number"
        ? body.bandwidthMbps
        : undefined;
    const uptimeSecRaw: number | undefined =
      typeof body?.uptimeSec === "number" ? body.uptimeSec : undefined;

    if (!wallet) {
      return NextResponse.json(
        { ok: false, error: "Missing wallet in heartbeat payload" },
        { status: 400 }
      );
    }

    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // uptime ถ้าไม่ส่งมาก็ใช้ค่าดีฟอลต์
    const uptimeSec = uptimeSecRaw && uptimeSecRaw > 0 ? uptimeSecRaw : DEFAULT_UPTIME_SEC;
    const pointsPerHeartbeat = POINTS_PER_HEARTBEAT;

    const now = new Date();
    const hourUtc = floorToUtcHour(now);

    // หา user จาก wallet
    const user = await prisma.user.findFirst({
      where: { wallet },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // header สำหรับ ip / user agent (เอาไปใช้ตอนหลังได้)
    const hdrs = headers();
    const forwardedFor = hdrs.get("x-forwarded-for") || "";
    const remoteAddr = forwardedFor.split(",")[0]?.trim() || null;
    const userAgent = hdrs.get("user-agent") || null;

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1) log ลง PointEvent
      await tx.pointEvent.create({
        data: {
          userId: user.id,
          type: "extension_farm",
          amount: pointsPerHeartbeat,
          meta: {
            source: "heartbeat",
            bandwidthMbps: bandwidthMbps ?? null,
            uptimeSec,
            ip: remoteAddr,
            ua: userAgent,
          },
        },
      });

      // 2) อัปเดตยอด PointBalance ของ user
      await tx.pointBalance.upsert({
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

      // 3) อัปเดต MetricsHourly ของ user
      await tx.metricsHourly.upsert({
        where: {
          hourUtc_userId_unique: {
            hourUtc,
            userId: user.id,
          },
        },
        update: {
          pointsEarned: {
            increment: pointsPerHeartbeat,
          },
          uptimePct: 0, // ไว้คิดทีหลังจาก uptimeSec ถ้าต้องการ
          avgBandwidth: bandwidthMbps ?? undefined,
          qfScore: 0,
          trustScore: 0,
          region: null,
          ip: remoteAddr,
          version: null,
        },
        create: {
          hourUtc,
          userId: user.id,
          pointsEarned: pointsPerHeartbeat,
          uptimePct: 0,
          avgBandwidth: bandwidthMbps ?? null,
          qfScore: 0,
          trustScore: 0,
          region: null,
          ip: remoteAddr,
          version: null,
        },
      });

            // 4) อัปเดต MetricsHourly แถว system (userId = null)
      await tx.metricsHourly.upsert({
        where: {
          hourUtc_userId_unique: {
            hourUtc,
            // prisma type บังคับ string แต่เราต้องการค่า null สำหรับ system row
            userId: null as any,
          },
        },
        update: {
          pointsEarned: {
            increment: pointsPerHeartbeat,
          },
        },
        create: {
          hourUtc,
          userId: null,
          pointsEarned: pointsPerHeartbeat,
          uptimePct: null,
          avgBandwidth: null,
          qfScore: null,
          trustScore: null,
          region: null,
          ip: null,
          version: null,
        },
      });


      return {
        pointsPerHeartbeat,
        hourUtc,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("heartbeat error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
