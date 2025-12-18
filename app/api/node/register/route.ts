import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEd25519Base64 } from "@/lib/crypto/verify";
import { getAuthedUserFromCookies } from "@/lib/server/auth";

export const runtime = "nodejs";

function allowAgent(req: Request) {
  const got = req.headers.get("x-node-key") || "";
  const expected = process.env.NODE_AGENT_KEY || "";
  return !!expected && got === expected;
}

/**
 * POST /api/node/register
 * Auth:
 *  - (A) cookie login (เดิม) หรือ
 *  - (B) header X-NODE-KEY = NODE_AGENT_KEY (สำหรับ dev/agent)
 *
 * body:
 *  publicKey, fingerprint?, region?, asn?, timestamp, nonce, signature
 *
 * message:
 *  REGISTER|<publicKey>|<timestamp>|<nonce>
 */
export async function POST(req: Request) {
  try {
    const agentOk = allowAgent(req);

    let userId: string | null = null;

    if (!agentOk) {
      const auth = await getAuthedUserFromCookies();
      if (!auth.ok) return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 });
      userId = auth.user.id;
    } else {
      // agent mode: ผูกกับ user "system" หรือสร้าง user เฉพาะ dev ก็ได้
      // ที่นี่ทำแบบง่าย: สร้าง/หา user wallet = "dev-system"
      const u = await prisma.user.upsert({
        where: { wallet: "dev-system" },
        update: {},
        create: { wallet: "dev-system" },
        select: { id: true },
      });
      userId = u.id;
    }

    const body = await req.json().catch(() => ({}));
    const publicKey = String(body.publicKey || "").trim();
    const fingerprint = body.fingerprint ? String(body.fingerprint) : null;
    const region = body.region ? String(body.region) : null;
    const asn = body.asn ? String(body.asn) : null;

    const timestamp = String(body.timestamp || "").trim();
    const nonce = String(body.nonce || "").trim();
    const signature = String(body.signature || "").trim();

    if (!publicKey || !timestamp || !nonce || !signature) {
      return NextResponse.json(
        { ok: false, error: "publicKey,timestamp,nonce,signature are required" },
        { status: 400 }
      );
    }

    const ts = new Date(timestamp);
    if (Number.isNaN(ts.getTime())) {
      return NextResponse.json({ ok: false, error: "invalid timestamp" }, { status: 400 });
    }

    const driftMs = Math.abs(Date.now() - ts.getTime());
    if (driftMs > 5 * 60 * 1000) {
      return NextResponse.json({ ok: false, error: "timestamp drift too large" }, { status: 400 });
    }

    const message = `REGISTER|${publicKey}|${timestamp}|${nonce}`;
    const okSig = verifyEd25519Base64({
      publicKeyB64: publicKey,
      signatureB64: signature,
      message,
    });

    if (!okSig) {
      return NextResponse.json({ ok: false, error: "signature invalid" }, { status: 401 });
    }

    const node = await prisma.node.upsert({
      where: { publicKey },
      update: {
        userId: userId!,
        fingerprint,
        region,
        asn,
      },
      create: {
        userId: userId!,
        publicKey,
        fingerprint,
        region,
        asn,
      },
      select: { id: true, publicKey: true, userId: true, fingerprint: true, region: true, asn: true },
    });

    return NextResponse.json({ ok: true, node, signatureOk: true });
  } catch (e: any) {
    console.error("[node/register] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Internal server error" }, { status: 500 });
  }
}
