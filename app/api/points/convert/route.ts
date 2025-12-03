// app/api/points/convert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";

type Body = {
  wallet?: string;
  points?: number;
};

// rate 1000 pts = 1 SLK
const CONVERT_RATE = 1000;
const GLOBAL_KEY = "convert_enabled";

function boolFromString(v: string | null | undefined, defaultVal = true): boolean {
  if (!v) return defaultVal;
  const x = v.toLowerCase();
  if (["1", "true", "yes", "on"].includes(x)) return true;
  if (["0", "false", "no", "off"].includes(x)) return false;
  return defaultVal;
}

// ส่ง error กลับ
function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

/**
 * ✅ อ่านสวิตช์ convert จาก DB ถ้ามี
 * ถ้าไม่เจอ row → fallback ไปใช้ ENV CONVERT_ENABLED
 */
async function isConvertEnabled(): Promise<boolean> {
  try {
    const row = await prisma.setting.findFirst({
      where: {
        userId: null,
        key: GLOBAL_KEY,
      },
    });

    if (row && typeof row.value === "string") {
      return boolFromString(row.value, true);
    }
  } catch (e) {
    console.error("convert / isConvertEnabled DB error:", e);
  }

  return boolFromString(process.env.CONVERT_ENABLED ?? "true", true);
}

export async function POST(req: NextRequest) {
  try {
    // ถ้าปิดเคลมอยู่ → ห้ามเข้า
    const enabled = await isConvertEnabled();
    if (!enabled) {
      return bad("conversion is currently disabled", 403);
    }

    const json = (await req.json().catch(() => ({}))) as Body;

    // หา wallet จาก JSON หรือ cookie
    const cookieWallet = cookies().get("solink_wallet")?.value;
    const wallet = (json.wallet || cookieWallet || "").trim();

    if (!wallet) {
      return bad("wallet required");
    }

    const rawPoints = json.points;
    if (typeof rawPoints !== "number" || !Number.isFinite(rawPoints)) {
      return bad("points must be a number");
    }
    const pts = Math.max(1, Math.floor(rawPoints));
    if (pts <= 0) {
      return bad("points must be > 0");
    }

    // หา user
    const user = await prisma.user.findUnique({
      where: { wallet },
    });
    if (!user) {
      return bad("user not found for this wallet", 404);
    }

    // 💎 ทำงานใน transaction เดียว: หักแต้ม + เพิ่ม SLK
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        let balance = await tx.pointBalance.findUnique({
          where: { userId: user.id },
        });

        // ถ้ายังไม่มี balance ให้สร้างก่อน
        if (!balance) {
          balance = await tx.pointBalance.create({
            data: {
              userId: user.id,
              balance: 0,
              slk: 0,
            },
          });
        }

        if (balance.balance < pts) {
          throw Object.assign(new Error("not_enough_points"), {
            code: "NOT_ENOUGH_POINTS",
          });
        }

        const slk = Number((pts / CONVERT_RATE).toFixed(4));

        const updated = await tx.pointBalance.update({
          where: { userId: user.id },
          data: {
            balance: { decrement: pts },
            slk: { increment: slk },
          },
        });

        const ev = await tx.pointEvent.create({
          data: {
            userId: user.id,
            type: "convert",
            amount: -pts,
            meta: {
              slk,
              rate: CONVERT_RATE,
              source: "api/points/convert",
            },
          },
        });

        return { updated, ev, slk };
      }
    );

    return NextResponse.json({
      ok: true,
      wallet,
      pointsSpent: pts,
      slkReceived: result.slk,
      rate: CONVERT_RATE,
      balance: {
        points: result.updated.balance,
        slk: result.updated.slk,
      },
      eventId: result.ev.id,
    });
  } catch (e: any) {
    if (e?.code === "NOT_ENOUGH_POINTS") {
      return bad("not enough points", 400);
    }

    console.error("convert error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal error" },
      { status: 500 }
    );
  }
}
