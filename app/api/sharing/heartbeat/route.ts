// app/api/sharing/heartbeat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

type Body = {
  uptimeSeconds?: number;
  downloadMbps?: number;
  uploadMbps?: number;
  latencyMs?: number;
  region?: string | null;
  version?: string | null;
};

function toFiniteNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Return the start of the current UTC hour (truncated). */
function floorToHourUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), 0, 0, 0));
}

function floorToMinuteUTC(d: Date): Date {
  return new Date(Math.floor(d.getTime() / 60_000) * 60_000);
}

/**
 * upsertHourlyBandwidthSample — write bandwidth to MetricsHourly every heartbeat.
 * Uses EMA (alpha=0.2) for smooth average.
 * Also stores region + version.
 */
async function upsertHourlyBandwidthSample(args: {
  userId: string;
  now: Date;
  bandwidthSampleMbps: number | null;
  region?: string | null;
  version?: string | null;
}) {
  const { userId, now, bandwidthSampleMbps, region, version } = args;
  if (bandwidthSampleMbps == null) return;

  const hourUtc = floorToHourUTC(now);
  const bw = bandwidthSampleMbps;

  const existing = await prisma.metricsHourly.findUnique({
    where: { hourUtc_userId_unique: { hourUtc, userId } },
    select: { id: true, avgBandwidth: true },
  });

  const alpha = 0.2;

  if (!existing) {
    await prisma.metricsHourly.create({
      data: { hourUtc, userId, pointsEarned: 0, avgBandwidth: bw, region: region ?? null, version: version ?? null },
    });
    return;
  }

  // EMA: new = old*0.8 + sample*0.2
  const old = existing.avgBandwidth;
  const next = (old == null ? bw : old * (1 - alpha) + bw * alpha);

  await prisma.metricsHourly.update({
    where: { id: existing.id },
    data: { avgBandwidth: next, region: region ?? null, version: version ?? null },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Auth: JWT cookie OR ?wallet= query param (CLI mode)
    const { wallet: jwtWallet } = await getAuthFromRequest(req);
    let userWallet: string | null = jwtWallet;
    if (!userWallet) {
      const urlStr = req.url ?? "";
      const wp = new URL(urlStr).searchParams.get("wallet");
      if (wp) userWallet = wp;
    }
    if (!userWallet) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findFirst({ where: { wallet: userWallet }, select: { id: true, wallet: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const uptimeSeconds = Number(body.uptimeSeconds ?? 0);
    const downloadMbps = toFiniteNumber(body.downloadMbps);
    const uploadMbps = toFiniteNumber(body.uploadMbps);
    const latencyMs = toFiniteNumber(body.latencyMs);
    const region = typeof body.region === "string" ? body.region : null;
    const version = typeof body.version === "string" ? body.version : null;

    const bandwidthSampleMbps =
      downloadMbps == null && uploadMbps == null
        ? null
        : Math.max(downloadMbps ?? 0, uploadMbps ?? 0);

    const now = new Date();

    // Write bandwidth to MetricsHourly on every heartbeat
    await upsertHourlyBandwidthSample({ userId: user.id, now, bandwidthSampleMbps, region, version });

    // Earn points: bandwidth_Mbps × 0.7 per minute (cooldown: max 1/min)
    const minutes = Math.max(0, Math.min(1, Math.floor(uptimeSeconds / 60)));
    if (minutes <= 0) {
      return NextResponse.json({ ok: true, active: true, awarded: 0, reason: "uptimeSeconds < 60", received: { uptimeSeconds, downloadMbps, uploadMbps, latencyMs } }, { status: 200 });
    }

    const bw = bandwidthSampleMbps ?? 10;
    const pointsPerMinute = Math.round(bw * 0.7);
    const awarded = Math.max(1, pointsPerMinute * minutes);
    const minuteBucket = floorToMinuteUTC(now);
    const dedupeKey = `sharing:${user.id}:UPTIME_MINUTE:${minuteBucket.toISOString()}`;

    // Check last event for cooldown
    const last = await prisma.pointEvent.findFirst({
      where: { userId: user.id, type: "UPTIME_MINUTE", source: "sharing" },
      orderBy: { occurredAt: "desc" },
      select: { occurredAt: true },
    });
    if (last) {
      const diffSec = (now.getTime() - new Date(last.occurredAt).getTime()) / 1000;
      if (diffSec < 45) {
        return NextResponse.json({ ok: true, active: true, awarded: 0, reason: `cooldown ${Math.ceil(45 - diffSec)}s` }, { status: 200 });
      }
    }

    // Transaction: create event (idempotent) + upsert balance
    const result = await prisma.$transaction(async (tx) => {
      const exists = await tx.pointEvent.findUnique({ where: { dedupeKey }, select: { id: true } });
      if (exists) return { duplicate: true, eventId: exists.id, credited: 0 };

      const ev = await tx.pointEvent.create({
        data: {
          userId: user.id, nodeId: null, type: "UPTIME_MINUTE", amount: awarded,
          meta: { uptimeSeconds, downloadMbps, uploadMbps, latencyMs, bandwidthSampleMbps, bandwidthMbps: bw, pointsPerMinute, region, version, source: "sharing/heartbeat" },
          source: "sharing", ruleVersion: "v2", dedupeKey,
          nonce: crypto.randomUUID(), signatureOk: true, riskScore: 0, occurredAt: minuteBucket,
        },
        select: { id: true },
      });

      const bal = await tx.pointBalance.upsert({
        where: { userId: user.id },
        update: { balance: { increment: awarded } },
        create: { userId: user.id, balance: awarded, slk: 0 },
        select: { balance: true, slk: true },
      });

      return { duplicate: false, eventId: ev.id, credited: awarded, balance: bal };
    });

    return NextResponse.json({
      ok: true, active: true, awarded: result.credited,
      reason: result.duplicate ? "duplicate" : undefined,
      balance: result.balance?.balance,
      received: { uptimeSeconds, downloadMbps, uploadMbps, latencyMs },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sharing/heartbeat]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
