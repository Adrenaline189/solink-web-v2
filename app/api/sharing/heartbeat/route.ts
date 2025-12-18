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
      return NextResponse.json(
        { ok: false, error: "No wallet cookie" },
        { status: 401 }
      );
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
        { ok: true, active: false, reason: "Sharing is paused", debug: { wallet, sharingState: sharing ?? null } },
        { status: 200 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as Body;

    const uptimeSeconds = Number(body.uptimeSeconds ?? 0);
    const downloadMbps = body.downloadMbps == null ? null : Number(body.downloadMbps);
    const uploadMbps = body.uploadMbps == null ? null : Number(body.uploadMbps);
    const latencyMs = body.latencyMs == null ? null : Number(body.latencyMs);

    // validate เบาๆ
    if (!Number.isFinite(uptimeSeconds) || uptimeSeconds <= 0) {
      return NextResponse.json({ ok: false, error: "uptimeSeconds must be > 0" }, { status: 400 });
    }

    // ให้แต้มเป็นนาที (กันปั่น: 1 request ได้สูงสุด 1 นาที)
    const minutes = Math.max(0, Math.min(1, Math.floor(uptimeSeconds / 60)));
    if (minutes <= 0) {
      return NextResponse.json(
        { ok: true, active: true, awarded: 0, reason: "uptimeSeconds < 60", received: { uptimeSeconds, downloadMbps, uploadMbps, latencyMs } },
        { status: 200 }
      );
    }

    const now = new Date();
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
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
