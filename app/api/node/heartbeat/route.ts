import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { awardPointEvent } from "@/lib/points/awardPointEvent";
import { verifyEd25519Base64 } from "@/lib/crypto/verify";
import { getAuthedUserFromCookies } from "@/lib/server/auth";

export const runtime = "nodejs";

function allowAgent(req: Request) {
  const got = req.headers.get("x-node-key") || "";
  const expected = process.env.NODE_AGENT_KEY || "";
  return !!expected && got === expected;
}

/**
 * POST /api/node/heartbeat
 * Auth:
 *  - (A) cookie login (เดิม) หรือ
 *  - (B) header X-NODE-KEY = NODE_AGENT_KEY (สำหรับ agent/dev)
 *
 * body: {
 *  publicKey: base64,
 *  timestamp: ISO,
 *  nonce: string,
 *  latencyMs?: number,
 *  signature: base64
 * }
 *
 * message:
 *  HEARTBEAT|<publicKey>|<timestamp>|<nonce>|<latencyMs>
 */
export async function POST(req: Request) {
  try {
    const agentOk = allowAgent(req);

    // ถ้าไม่ใช่ agent mode → ต้อง login เหมือนเดิม
    let userIdFromCookie: string | null = null;
    if (!agentOk) {
      const auth = await getAuthedUserFromCookies();
      if (!auth.ok) return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 });
      userIdFromCookie = auth.user.id;
    }

    const body = await req.json().catch(() => ({}));
    const publicKey = String(body.publicKey || "").trim();
    const timestamp = String(body.timestamp || "").trim();
    const nonce = String(body.nonce || "").trim();
    const signature = String(body.signature || "").trim();
    const latencyMs = typeof body.latencyMs === "number" ? body.latencyMs : null;

    if (!publicKey || !timestamp || !nonce || !signature) {
      return NextResponse.json(
        { ok: false, error: "publicKey,timestamp,nonce,signature are required" },
        { status: 400 }
      );
    }

    const at = new Date(timestamp);
    if (Number.isNaN(at.getTime())) {
      return NextResponse.json({ ok: false, error: "invalid timestamp" }, { status: 400 });
    }

    // กัน replay: timestamp drift <= 2 นาที
    const driftMs = Math.abs(Date.now() - at.getTime());
    if (driftMs > 2 * 60 * 1000) {
      return NextResponse.json({ ok: false, error: "timestamp drift too large" }, { status: 400 });
    }

    // หา node ด้วย publicKey
    const node = await prisma.node.findUnique({
      where: { publicKey },
      select: { id: true, userId: true },
    });
    if (!node) return NextResponse.json({ ok: false, error: "node not found" }, { status: 404 });

    // ถ้าเป็น cookie auth → บังคับว่า node ต้องเป็นของ user นั้น
    if (!agentOk && userIdFromCookie && node.userId !== userIdFromCookie) {
      return NextResponse.json({ ok: false, error: "node does not belong to user" }, { status: 403 });
    }

    // verify signature
    const message = `HEARTBEAT|${publicKey}|${timestamp}|${nonce}|${latencyMs ?? ""}`;
    const okSig = verifyEd25519Base64({
      publicKeyB64: publicKey,
      signatureB64: signature,
      message,
    });

    // ปัดเป็นนาที (minute bucket)
    const minuteIso = new Date(Math.floor(at.getTime() / 60000) * 60000).toISOString();
    const hbAt = new Date(minuteIso);

    // บันทึก heartbeat (unique nodeId+at)
    await prisma.nodeHeartbeat.upsert({
      where: { nodeId_at: { nodeId: node.id, at: hbAt } },
      update: { latencyMs, signatureOk: okSig },
      create: {
        at: hbAt,
        latencyMs,
        signatureOk: okSig,
        node: { connect: { id: node.id } },
      },
    });

    // แจกแต้มเฉพาะ signature ผ่าน
    const awarded = okSig
      ? await awardPointEvent({
          userId: node.userId,
          nodeId: node.id,
          type: "UPTIME_MINUTE",
          amount: 1,
          source: "node-agent",
          ruleVersion: "v2_sig",
          dedupeKey: `${node.id}:UPTIME_MINUTE:${minuteIso}`,
          meta: { latencyMs, nonce },
          signatureOk: true,
          riskScore: 0,
          occurredAt: hbAt,
        })
      : { ok: true, skipped: true, reason: "signature invalid" };

    return NextResponse.json({ ok: true, signatureOk: okSig, awarded });
  } catch (e: any) {
    console.error("[node/heartbeat] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Internal server error" }, { status: 500 });
  }
}
