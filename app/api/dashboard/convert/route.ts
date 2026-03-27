// app/api/dashboard/convert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";

const DEFAULT_RATE = 100; // fallback: 100 pts = 1 SLK

type ConvertBody = {
  points?: number;
};

type SolinkApiConvertResp = {
  ok: boolean;
  wallet?: string;
  points?: number;
  slk?: number;
  rate?: number;
  txId?: string;
  message?: string;
  error?: string;
};

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext(req);
    if (!ctx?.wallet) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const wallet = ctx.wallet;

    const body = (await req.json()) as ConvertBody;
    const rawPoints = body.points;

    if (typeof rawPoints !== "number" || !Number.isFinite(rawPoints)) {
      return NextResponse.json(
        { ok: false, error: "Invalid points" },
        { status: 400 }
      );
    }

    const points = Math.max(0, Math.floor(rawPoints));

    if (points <= 0) {
      return NextResponse.json(
        { ok: false, error: "Points must be greater than zero" },
        { status: 400 }
      );
    }

    // ==============================
    // 1) ถ้ามี SOLINK_API_URL → proxy ไปที่ Solink API จริง
    // ==============================
    const apiBase = process.env.SOLINK_API_URL?.trim();

    if (apiBase) {
      try {
        const apiUrl = apiBase.replace(/\/$/, "") + "/api/points/convert";

        const apiRes = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // NOTE: ขึ้นกับ spec ของ solink-api:
          // สมมติรับ { wallet, points } และจัดการ ledger ทั้งหมดฝั่ง API
          body: JSON.stringify({ wallet, points }),
        });

        if (!apiRes.ok) {
          const text = await apiRes.text().catch(() => "");
          console.error("Solink API convert error:", apiRes.status, text);

          return NextResponse.json(
            {
              ok: false,
              error:
                "Solink API convert failed: " +
                (text?.slice(0, 200) || apiRes.statusText),
            },
            { status: 502 }
          );
        }

        const data = (await apiRes.json()) as SolinkApiConvertResp;

        if (!data.ok) {
          return NextResponse.json(
            {
              ok: false,
              error: data.error || "Solink API convert returned not ok",
            },
            { status: 400 }
          );
        }

        // ส่งต่อข้อมูลจาก Solink API กลับไปที่ frontend
        return NextResponse.json({
          ok: true,
          mode: "api",
          wallet: data.wallet ?? wallet,
          points: data.points ?? points,
          slk: data.slk,
          rate: data.rate ?? DEFAULT_RATE,
          txId: data.txId ?? null,
          message:
            data.message ??
            "Converted via Solink API. Ledger/on-chain update handled server-side.",
        });
      } catch (e) {
        console.error("Solink API proxy error:", e);
        return NextResponse.json(
          {
            ok: false,
            error: "Failed to contact Solink API for conversion",
          },
          { status: 502 }
        );
      }
    }

    // ==============================
    // 2) ถ้าไม่มี SOLINK_API_URL → fallback preview mode (ไม่แตะ ledger จริง)
    // ==============================
    const rate = DEFAULT_RATE;
    const slkFloat = points / rate;
    const slk = Number(slkFloat.toFixed(4));

    return NextResponse.json({
      ok: true,
      mode: "preview",
      wallet,
      points,
      slk,
      rate,
      message:
        "Preview only: SOLINK_API_URL is not configured, so no real ledger/on-chain update was done.",
    });
  } catch (e) {
    console.error("convert error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
