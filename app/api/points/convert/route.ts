// app/api/points/convert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

type Body = {
  wallet?: string;
  points?: number;
};

const CONVERT_RATE = 1000;
const GLOBAL_KEY = "convert_enabled";

function boolFromString(v: string | null | undefined, defaultVal = true): boolean {
  if (!v) return defaultVal;
  const x = v.toLowerCase();
  if (["1", "true", "yes", "on"].includes(x)) return true;
  if (["0", "false", "no", "off"].includes(x)) return false;
  return defaultVal;
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

async function isConvertEnabled(): Promise<boolean> {
  try {
    const row = await prisma.setting.findFirst({
      where: { userId: null, key: GLOBAL_KEY },
    });
    if (row?.value) return boolFromString(row.value, true);
  } catch (e) {
    console.error("convert / isConvertEnabled DB error:", e);
  }
  return boolFromString(process.env.CONVERT_ENABLED ?? "true", true);
}

export async function POST(req: NextRequest) {
  try {
    const enabled = await isConvertEnabled();
    if (!enabled) return bad("conversion is currently disabled", 403);

    const json = (await req.json().catch(() => ({}))) as Body;

    const cookieWallet = cookies().get("solink_wallet")?.value;
    const wallet = (json.wallet || cookieWallet || "").trim();
    if (!wallet) return bad("wallet required");

    const rawPoints = json.points;
    if (typeof rawPoints !== "number" || !Number.isFinite(rawPoints)) {
      return bad("points must be a number");
    }

    const pts = Math.max(1, Math.floor(rawPoints));
    const user = await prisma.user.findUnique({ where: { wallet } });
    if (!user) return bad("user not found for this wallet", 404);

    const occurredAt = new Date();
    const dedupeKey = `convert:${user.id}:${crypto.randomUUID()}`;

    const result = await prisma.$transaction(async (tx) => {
      let balance = await tx.pointBalance.findUnique({ where: { userId: user.id } });

      if (!balance) {
        balance = await tx.pointBalance.create({
          data: { userId: user.id, balance: 0, slk: 0 },
        });
      }

      if (balance.balance < pts) {
        throw Object.assign(new Error("not_enough_points"), { code: "NOT_ENOUGH_POINTS" });
      }

      const slk = Number((pts / CONVERT_RATE).toFixed(4));

      const updated = await tx.pointBalance.update({
        where: { userId: user.id },
        data: { balance: { decrement: pts }, slk: { increment: slk } },
        select: { balance: true, slk: true },
      });

      const ev = await tx.pointEvent.create({
        data: {
          userId: user.id,
          nodeId: null,
          type: "convert",
          amount: -pts,
          meta: { slk, rate: CONVERT_RATE, source: "api/points/convert" },
          source: "api/points/convert",
          ruleVersion: "v1",
          dedupeKey,
          nonce: null,
          signatureOk: true,
          riskScore: 0,
          occurredAt,
        },
        select: { id: true },
      });

      return { updated, ev, slk };
    });

    return NextResponse.json({
      ok: true,
      wallet,
      pointsSpent: pts,
      slkReceived: result.slk,
      rate: CONVERT_RATE,
      balance: { points: result.updated.balance, slk: result.updated.slk },
      eventId: result.ev.id,
    });
  } catch (e: any) {
    if (e?.code === "NOT_ENOUGH_POINTS") return bad("not enough points", 400);
    console.error("convert error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "internal error" }, { status: 500 });
  }
}
