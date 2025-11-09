// app/api/dev/earn/route.ts
import { NextRequest, NextResponse } from "next/server";

const API = process.env.SOLINK_API_URL || "https://api-solink.network";

export async function POST(req: NextRequest) {
  try {
    const { wallet = "demo_wallet", type = "extension_farm", amount = 50, meta = {} } = await req.json();

    // --- 1) login เพื่อขอ token ---
    const loginRes = await fetch(`${API}/api/auth/demo-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet }),
      cache: "no-store",
    });
    if (!loginRes.ok) {
      const err = await loginRes.text();
      return NextResponse.json({ ok: false, error: `demo-login failed: ${err}` }, { status: 401 });
    }
    const { token } = await loginRes.json();

    // --- 2) ยิง earn ด้วย Bearer token ---
    const earnRes = await fetch(`${API}/api/points/earn`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, amount, meta }),
      cache: "no-store",
    });

    const data = await earnRes.json().catch(() => ({}));
    if (!earnRes.ok) {
      return NextResponse.json({ ok: false, error: data?.error || "earn failed" }, { status: 400 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unexpected error" }, { status: 500 });
  }
}
