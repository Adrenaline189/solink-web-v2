import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext(req);
    if (!ctx?.wallet) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({ where: { wallet: ctx.wallet } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const dayStart = startOfUtcDay(now);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    // extension_farm points วันนี้
    const todayAgg = await prisma.pointEvent.aggregate({
      where: {
        userId: user.id,
        type: "extension_farm",
        occurredAt: { gte: dayStart, lt: dayEnd },
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    });

    // extension_farm points ทั้งหมด
    const totalAgg = await prisma.pointEvent.aggregate({
      where: {
        userId: user.id,
        type: "extension_farm",
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    });

    // หา heartbeat ล่าสุดของ extension_farm
    const lastEvent = await prisma.pointEvent.findFirst({
      where: {
        userId: user.id,
        type: "extension_farm",
      },
      orderBy: { occurredAt: "desc" },
      select: { occurredAt: true, meta: true },
    });

    // คำนวณ uptime วันนี้ (นับจากจำนวน events)
    const todayEvents = await prisma.pointEvent.count({
      where: {
        userId: user.id,
        type: "extension_farm",
        occurredAt: { gte: dayStart, lt: dayEnd },
        amount: { gt: 0 },
      },
    });

    // extension active = มี event ภายใน 5 นาที
    const last5Min = new Date(now.getTime() - 5 * 60 * 1000);
    const recentEvents = await prisma.pointEvent.findFirst({
      where: {
        userId: user.id,
        type: "extension_farm",
        occurredAt: { gte: last5Min },
      },
    });

    const farmPointsToday = Number(todayAgg._sum.amount ?? 0);
    const farmPointsTotal = Number(totalAgg._sum.amount ?? 0);
    const uptimeSeconds = todayEvents * 60; // ประมาณ 1 event = 1 นาที

    return NextResponse.json({
      ok: true,
      farmPointsToday: Math.max(0, farmPointsToday),
      farmPointsTotal: Math.max(0, farmPointsTotal),
      extensionActive: !!recentEvents,
      uptimeSeconds,
      lastHeartbeat: lastEvent?.occurredAt?.toISOString() ?? null,
      todayEarnings: Math.max(0, farmPointsToday),
    });
  } catch (e: any) {
    console.error("[dashboard/farm-stats] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Internal error" }, { status: 500 });
  }
}

// POST: simulate extension farm (dev/testing)
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext(req);
    if (!ctx?.wallet) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({ where: { wallet: ctx.wallet } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const points = 10; // ตาม POINTS_PER_HEARTBEAT
    const dedupeKey = `sim-farm:${user.id}:${now.toISOString()}`;

    await prisma.$transaction(async (tx) => {
      await tx.pointEvent.create({
        data: {
          userId: user.id,
          type: "extension_farm",
          amount: points,
          source: "farm-simulate",
          ruleVersion: "v1",
          dedupeKey,
          occurredAt: now,
          meta: { source: "simulate", simulated: true },
        },
      });

      await tx.pointBalance.upsert({
        where: { userId: user.id },
        update: { balance: { increment: points } },
        create: { userId: user.id, balance: points, slk: 0 },
      });
    });

    // return fresh stats
    const result = await GET(req as NextRequest);
    return result;
  } catch (e: any) {
    console.error("[dashboard/farm-stats POST] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Internal error" }, { status: 500 });
  }
}
