// app/api/dashboard/realtime/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function floorUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET() {
  const store = cookies();
  const wallet = store.get("solink_wallet")?.value;
  const auth = store.get("solink_auth")?.value;

  if (!wallet || !auth) {
    return NextResponse.json(
      {
        ok: false,
        error: "Not authenticated",
        pointsToday: 0,
        livePoints: 0,
        rolledPoints: 0,
        dayUtc: floorUtcDay(new Date()).toISOString(),
        serverTime: new Date().toISOString(),
      },
      {
        status: 401,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" },
      }
    );
  }

  const user = await prisma.user.findFirst({ where: { wallet } });
  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: "User not found",
        pointsToday: 0,
        livePoints: 0,
        rolledPoints: 0,
        wallet,
        dayUtc: floorUtcDay(new Date()).toISOString(),
        serverTime: new Date().toISOString(),
      },
      {
        status: 404,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" },
      }
    );
  }

  const now = new Date();
  const dayStartUtc = floorUtcDay(now);
  const dayEndUtc = new Date(dayStartUtc.getTime() + 24 * 60 * 60 * 1000);

  // 1) realtime events (วันนี้ UTC)
  const live = await prisma.pointEvent.aggregate({
    where: {
      userId: user.id,
      occurredAt: { gte: dayStartUtc, lt: dayEndUtc },
    },
    _sum: { amount: true },
  });

  // 2) hourly rollup (วันนี้ UTC)
  const hourly = await prisma.metricsHourly.aggregate({
    where: {
      userId: user.id,
      hourUtc: { gte: dayStartUtc, lt: dayEndUtc },
    },
    _sum: { pointsEarned: true },
  });

  const livePoints = live._sum.amount ?? 0;
  const rolledPoints = hourly._sum.pointsEarned ?? 0;

  return NextResponse.json(
    {
      ok: true,
      pointsToday: Math.max(livePoints, rolledPoints),
      livePoints,
      rolledPoints,
      wallet,
      userId: user.id,
      dayUtc: dayStartUtc.toISOString(),
      serverTime: now.toISOString(),
    },
    {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" },
    }
  );
}
