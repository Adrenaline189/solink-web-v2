// app/api/dashboard/ping/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAuthContext } from "@/lib/auth";

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || null;
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return null;
}

function asNumber(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest) {
  try {
    // ✅ ใช้ auth จาก solink_auth (JWT) เป็นหลัก
    const ctx = await getAuthContext(req);
    if (!ctx?.wallet) {
      return NextResponse.json(
        {
          ok: false,
          connected: false,
          error: "Not authenticated",
          region: null,
          ip: getClientIp(req),
          version: null,
          latencyMs: null,
          series: [],
          serverTime: new Date().toISOString(),
        },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const user = await prisma.user.findFirst({ where: { wallet: ctx.wallet } });
    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          connected: false,
          error: "User not found",
          region: null,
          ip: getClientIp(req),
          version: null,
          latencyMs: null,
          series: [],
          serverTime: new Date().toISOString(),
        },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    // เลือก node ล่าสุดที่มี region ก่อน (กันเคส node ใหม่ยังไม่ได้ใส่ region)
    const nodeWithRegion = await prisma.node.findFirst({
      where: { userId: user.id, region: { not: null } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, region: true },
    });

    const nodeAny = nodeWithRegion
      ? nodeWithRegion
      : await prisma.node.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          select: { id: true, region: true },
        });

    // latest MetricsHourly (เอา version/region fallback)
    const mh = await prisma.metricsHourly.findFirst({
      where: { userId: user.id },
      orderBy: { hourUtc: "desc" },
      select: { version: true, region: true },
    });

    const region = nodeAny?.region ?? mh?.region ?? null;
    const version = mh?.version ?? null;

    // latency series จาก PointEvent.meta.latencyMs (ล่าสุด ~60 จุด)
    // ✅ Prisma Json filter: ใช้ AnyNull เพื่อกันทั้ง DbNull/JsonNull
    const evs = await prisma.pointEvent.findMany({
      where: {
        userId: user.id,
        source: "sharing",
        meta: { not: Prisma.AnyNull },
      },
      orderBy: { occurredAt: "desc" },
      take: 60,
      select: { occurredAt: true, meta: true },
    });

    const series = evs
      .map((e) => {
        const meta = (e.meta ?? {}) as Record<string, unknown>;
        const latencyMs = asNumber((meta as any).latencyMs);
        if (latencyMs == null) return null;
        return { ts: e.occurredAt.toISOString(), latencyMs };
      })
      .filter((x): x is { ts: string; latencyMs: number } => !!x)
      .reverse();

    const latencyMs = series.length ? series[series.length - 1].latencyMs : null;

    return NextResponse.json(
      {
        ok: true,
        connected: true,
        region,
        ip: getClientIp(req),
        version,
        latencyMs,
        series,
        serverTime: new Date().toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("[dashboard/ping] error:", e);
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        error: e?.message || "Internal server error",
        region: null,
        ip: null,
        version: null,
        latencyMs: null,
        series: [],
        serverTime: new Date().toISOString(),
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
