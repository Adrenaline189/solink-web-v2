// app/api/sharing/heartbeat/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

type Body = {
  uptimeSeconds?: number;
  downloadMbps?: number;
  uploadMbps?: number;
  latencyMs?: number;
};

function floorToMinuteUTC(d: Date) {
  const x = new Date(d);
  x.setUTCSeconds(0, 0);
  return x;
}

function floorToHourUTC(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), 0, 0, 0)
  );
}

function toFiniteNumber(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * อัปเดต bandwidth sample ลง MetricsHourly (ชั่วโมงปัจจุบัน UTC)
 * - ทำให้ /summary?range=today มี avgBandwidthMbps ได้ทันที (ไม่ติด 0)
 * - ใช้ EMA เพื่อให้กราฟนิ่งขึ้น (ไม่เด้งแรง)
 */
async function upsertHourlyBandwidthSample(args: {
  userId: string;
  now: Date;
  bandwidthSampleMbps: number | null;
}) {
  const { userId, now, bandwidthSampleMbps } = args;
  if (bandwidthSampleMbps == null) return;

  const hourUtc = floorToHourUTC(now);

  const existing = await prisma.metricsHourly.findUnique({
    where: {
      hourUtc_userId_unique: {
        hourUtc,
        userId,
      },
    },
    select: { id: true, avgBandwidth: true },
  });

  // EMA: new = old*0.8 + sample*0.2
  const alpha = 0.2;

  if (!existing) {
    await prisma.metricsHourly.create({
      data: {
        hourUtc,
        userId,
        pointsEarned: 0,
        avgBandwidth: bandwidthSampleMbps,
        // region/version ไม่ได้อยู่ใน User schema ของคุณแล้ว -> ไม่ใส่
      },
    });
    return;
  }

  const old = typeof existing.avgBandwidth === "number" ? existing.avgBandwidth : null;
  const next =
    old == null ? bandwidthSampleMbps : old * (1 - alpha) + bandwidthSampleMbps * alpha;

  await prisma.metricsHourly.update({
    where: { id: existing.id },
    data: { avgBandwidth: next },
  });
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();

    const auth = cookieStore.get("solink_auth")?.value;
    if (!auth) {
      return NextResponse.json(
        { ok: true, active: false, reason: "Not authenticated" },
        { status: 200 }
      );
    }

    const wallet = cookieStore.get("solink_wallet")?.value?.trim();
    if (!wallet) {
      return NextResponse.json({ ok: false, error: "No wallet cookie" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({ where: { wallet } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // ✅ ต้อง active จริง
    const sharing = await prisma.sharingState.findUnique({
      where: { wallet },
      select: { active: true, updatedAt: true },
    });

    const active = !!sharing?.active;
    if (!active) {
      return NextResponse.json(
        {
          ok: true,
          active: false,
          reason: "Sharing is paused",
          debug: { wallet, sharingState: sharing ?? null },
        },
        { status: 200 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as Body;

    const uptimeSeconds = Number(body.uptimeSeconds ?? 0);
    const downloadMbps = toFiniteNumber(body.downloadMbps);
    const uploadMbps = toFiniteNumber(body.uploadMbps);
    const latencyMs = toFiniteNumber(body.latencyMs);

    // ✅ bandwidth sample (เลือก max ระหว่าง down/up เพื่อไม่ทำให้ค่าดูต่ำเกิน)
    const bandwidthSampleMbps =
      downloadMbps == null && uploadMbps == null
        ? null
        : Math.max(downloadMbps ?? 0, uploadMbps ?? 0);

    const now = new Date();

    // ✅ สำคัญ: อัปเดต bandwidth ลง MetricsHourly ทุกครั้ง (แม้ uptime ยังไม่ครบ 60 วิ)
    // เพื่อให้ KPI "Last 15 minutes" (today) ไม่ติด 0
    await upsertHourlyBandwidthSample({
      userId: user.id,
      now,
      bandwidthSampleMbps,
    });

    // validate เบาๆ
    if (!Number.isFinite(uptimeSeconds) || uptimeSeconds <= 0) {
      return NextResponse.json({ ok: false, error: "uptimeSeconds must be > 0" }, { status: 400 });
    }

    // ให้แต้มเป็นนาที (กันปั่น: 1 request ได้สูงสุด 1 นาที)
    const minutes = Math.max(0, Math.min(1, Math.floor(uptimeSeconds / 60)));
    if (minutes <= 0) {
      return NextResponse.json(
        {
          ok: true,
          active: true,
          awarded: 0,
          reason: "uptimeSeconds < 60",
          received: { uptimeSeconds, downloadMbps, uploadMbps, latencyMs },
        },
        { status: 200 }
      );
    }

    const minuteBucket = floorToMinuteUTC(now); // ใช้เป็น occurredAt
    const dedupeKey = `sharing:${user.id}:UPTIME_MINUTE:${minuteBucket.toISOString()}`;

    // กันยิงถี่: ดู event ล่าสุดของ sharing uptime
    const last = await prisma.pointEvent.findFirst({
      where: {
        userId: user.id,
        type: "UPTIME_MINUTE",
        source: "sharing",
      },
      orderBy: { occurredAt: "desc" },
      select: { occurredAt: true },
    });

    if (last) {
      const diffSec = (now.getTime() - new Date(last.occurredAt).getTime()) / 1000;
      if (diffSec < 45) {
        return NextResponse.json(
          { ok: true, active: true, awarded: 0, reason: `cooldown ${Math.ceil(45 - diffSec)}s` },
          { status: 200 }
        );
      }
    }

    // Transaction: create event (idempotent by dedupeKey) + upsert balance
    const result = await prisma.$transaction(async (tx) => {
      // ถ้ามีแล้ว = ไม่ให้ซ้ำ
      const exists = await tx.pointEvent.findUnique({
        where: { dedupeKey },
        select: { id: true },
      });

      if (exists) {
        return { duplicate: true, eventId: exists.id, credited: 0 };
      }

      const ev = await tx.pointEvent.create({
        data: {
          userId: user.id,
          nodeId: null,
          type: "UPTIME_MINUTE",
          amount: minutes, // นาทีละ 1 point
          meta: {
            uptimeSeconds,
            downloadMbps,
            uploadMbps,
            latencyMs,
            bandwidthSampleMbps, // ✅ เพิ่มไว้ให้ summary/debug ใช้ง่าย
            source: "sharing/heartbeat",
          },
          source: "sharing",
          ruleVersion: "v1",
          dedupeKey,
          nonce: crypto.randomUUID(),
          signatureOk: true,
          riskScore: 0,
          occurredAt: minuteBucket,
        },
        select: { id: true },
      });

      const bal = await tx.pointBalance.upsert({
        where: { userId: user.id },
        update: { balance: { increment: minutes } },
        create: { userId: user.id, balance: minutes, slk: 0 },
        select: { balance: true, slk: true },
      });

      return { duplicate: false, eventId: ev.id, credited: minutes, balance: bal };
    });

    return NextResponse.json(
      {
        ok: true,
        active: true,
        awarded: result.credited ?? 0,
        duplicate: result.duplicate ?? false,
        eventId: result.eventId,
        balance: result.balance ?? undefined,
        received: { uptimeSeconds, downloadMbps, uploadMbps, latencyMs },
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[sharing/heartbeat] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Internal server error" }, { status: 500 });
  }
}
