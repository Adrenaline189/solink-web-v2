import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function requireVerifierKey(req: Request) {
  const got = req.headers.get("x-verifier-key") || "";
  const expected = process.env.VERIFIER_KEY || "";
  return !!expected && got === expected;
}

/**
 * POST /api/verifier/test
 * header: X-VERIFIER-KEY: <VERIFIER_KEY>
 * body: {
 *   publicKey: string,
 *   startedAt: string,
 *   finishedAt: string,
 *   downloadMbps: number,
 *   uploadMbps: number,
 *   latencyMs: number,
 *   jitterMs?: number,
 *   packetLoss?: number,
 *   success: boolean
 * }
 */
export async function POST(req: Request) {
  try {
    if (!requireVerifierKey(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const publicKey = String(body.publicKey || "").trim();
    const startedAt = new Date(String(body.startedAt || ""));
    const finishedAt = new Date(String(body.finishedAt || ""));

    const downloadMbps = Number(body.downloadMbps);
    const uploadMbps = Number(body.uploadMbps);
    const latencyMs = Number(body.latencyMs);

    const jitterMs = body.jitterMs !== undefined ? Number(body.jitterMs) : null;
    const packetLoss = body.packetLoss !== undefined ? Number(body.packetLoss) : null;
    const success = Boolean(body.success);

    if (!publicKey) return NextResponse.json({ ok: false, error: "publicKey required" }, { status: 400 });
    if (Number.isNaN(startedAt.getTime()) || Number.isNaN(finishedAt.getTime())) {
      return NextResponse.json({ ok: false, error: "invalid startedAt/finishedAt" }, { status: 400 });
    }
    if (!Number.isFinite(downloadMbps) || !Number.isFinite(uploadMbps) || !Number.isFinite(latencyMs)) {
      return NextResponse.json({ ok: false, error: "downloadMbps/uploadMbps/latencyMs must be numbers" }, { status: 400 });
    }

    const node = await prisma.node.findUnique({
      where: { publicKey },
      select: { id: true },
    });
    if (!node) return NextResponse.json({ ok: false, error: "node not found" }, { status: 404 });

    const test = await prisma.verifierTest.create({
      data: {
        node: { connect: { id: node.id } },
        startedAt,
        finishedAt,
        downloadMbps,
        uploadMbps,
        latencyMs,
        jitterMs,
        packetLoss,
        success,
      },
    });

    return NextResponse.json({ ok: true, test });
  } catch (e: any) {
    console.error("[verifier/test] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Internal server error" }, { status: 500 });
  }
}
