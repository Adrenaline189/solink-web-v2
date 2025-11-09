// app/api/dev/earn/route.ts
import { NextRequest, NextResponse } from "next/server";

const API = process.env.SOLINK_API_URL || "https://api-solink.network";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      wallet = "demo_wallet",
      type = "extension_farm",
      amount = 50,
      meta = {},
      debug = true, // เปิดดีบักไว้ก่อน
    } = body || {};

    // 1) login เพื่อเอา JWT
    const loginRes = await fetch(`${API}/api/auth/demo-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet }),
      cache: "no-store",
    });

    const loginText = await loginRes.text();
    if (!loginRes.ok) {
      return NextResponse.json(
        { ok: false, step: "login", status: loginRes.status, error: loginText },
        { status: 401 }
      );
    }
    const { token } = JSON.parse(loginText || "{}");

    // เตรียม payload earn — ใส่ nonce เสมอ, และถ้าเป็น extension_farm บังคับ session ให้มีเสมอ
    const safeMeta =
      type === "extension_farm"
        ? { session: meta?.session || `dash-${Date.now()}` }
        : type === "referral_bonus"
        ? { referredUserId: meta?.referredUserId ?? "" }
        : meta || {};

    const earnPayload = {
      type,
      amount,
      meta: { ...safeMeta, nonce: `dash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
    };

    // 2) earn
    const earnRes = await fetch(`${API}/api/points/earn`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(earnPayload),
      cache: "no-store",
    });

    const earnText = await earnRes.text();
    let earnJson: any = {};
    try { earnJson = JSON.parse(earnText); } catch { earnJson = { raw: earnText }; }

    // ส่งดีบักให้เห็นชัด ๆ
    if (debug) {
      return NextResponse.json(
        {
          ok: earnRes.ok,
          upstreamStatus: earnRes.status,
          sent: { wallet, ...earnPayload },
          received: earnJson,
        },
        { status: earnRes.ok ? 200 : 400 }
      );
    }

    return NextResponse.json(earnJson, { status: earnRes.ok ? 200 : 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unexpected error" }, { status: 500 });
  }
}
