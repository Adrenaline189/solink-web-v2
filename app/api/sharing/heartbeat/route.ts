// app/api/sharing/heartbeat/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/sharing/heartbeat
 *
 * ใช้ยิงจากหน้า Dashboard เมื่อปุ่ม Sharing = Active
 * ทุกครั้งที่เรียก จะ + แต้มให้ user ที่ผูกกับ wallet ใน cookie
 */
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();

    // 1) อ่าน wallet จาก cookie (เซ็ตจากหน้า dashboard ตอน connect)
    const wallet = cookieStore.get("solink_wallet")?.value;

    if (!wallet) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing wallet cookie (solink_wallet).",
        },
        { status: 401 }
      );
    }

    // 2) หา user จาก wallet
    const user = await prisma.user.findFirst({
      where: { wallet },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: "User not found for this wallet.",
        },
        { status: 404 }
      );
    }

    // 3) พยายามอ่าน JSON body (bandwidthMbps, uptimeSec) ถ้าอ่านไม่ได้ก็ปล่อยเป็น default
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const bandwidthMbps = Number(body.bandwidthMbps) || 0;
    const uptimeSec = Number(body.uptimeSec) || 0;

    // 4) คำนวณแต้มที่จะให้ต่อ 1 heartbeat (ตอนนี้ fix ไว้ก่อนให้เห็นผลชัด ๆ)
    const pointsEarned = 10; // ✅ ให้ 10 แต้ม / heartbeat (ปรับทีหลังได้)

    // 5) หาชั่วโมงปัจจุบันแบบ UTC (ใช้เก็บใน MetricsHourly)
    const now = new Date();
    const hourUtc = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours()
      )
    );

    const userAgent = headers().get("user-agent") || "";
    const ip =
      headers().get("x-forwarded-for") ||
      (headers().get("x-real-ip") as string) ||
      "unknown";

    // 6) เขียนข้อมูลลงฐานด้วย transaction:
    //    - PointEvent (ledger)
    //    - PointBalance (ยอดคงเหลือ)
    //    - MetricsHourly (per-user)
    const [event, balance, hourly] = await prisma.$transaction([
      // 6.1) สร้าง ledger event
      prisma.pointEvent.create({
        data: {
          userId: user.id,
          type: "extension_farm",
          amount: pointsEarned,
          meta: {
            source: "sharing_heartbeat",
            bandwidthMbps,
            uptimeSec,
            ip,
            userAgent,
          },
        },
      }),

      // 6.2) อัปเดตยอดแต้มคงเหลือ
      prisma.pointBalance.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          balance: pointsEarned,
        },
        update: {
          balance: { increment: pointsEarned },
        },
      }),

      // 6.3) อัปเดต MetricsHourly ของ user นี้ (เอาไว้ใช้ใน dashboard user)
      prisma.metricsHourly.upsert({
        where: {
          hourUtc_userId_unique: {
            hourUtc,
            userId: user.id,
          },
        },
        create: {
          hourUtc,
          userId: user.id,
          pointsEarned: pointsEarned,
          avgBandwidth: bandwidthMbps || null,
          uptimePct: null,
          qfScore: null,
          trustScore: null,
          ip,
          region: null,
          version: null,
        },
        update: {
          pointsEarned: {
            increment: pointsEarned,
          },
          avgBandwidth:
            bandwidthMbps > 0 ? bandwidthMbps : undefined,
          ip,
        },
      }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        pointsEarned,
        totalPoints: balance.balance,
        eventId: event.id,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("sharing heartbeat error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
