// app/api/dev/reset/route.ts
import { NextRequest, NextResponse } from "next/server";

const API = process.env.SOLINK_API_URL || "https://api-solink.network";
const DEV_SECRET = process.env.DEV_SECRET || "";

if (!DEV_SECRET) {
  // safety: avoid accidental exposure in non-dev env
  console.warn("DEV_SECRET not set — dev reset endpoint will be disabled.");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { secret, action = "reset_wallet", wallet } = body || {};

    if (!DEV_SECRET || secret !== DEV_SECRET) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 403 });
    }

    if (!wallet) {
      return NextResponse.json({ ok: false, error: "wallet required" }, { status: 400 });
    }

    // Example: call upstream admin/dev endpoint if available.
    // If upstream has no reset API, you can implement custom logic here (e.g., delete events via DB admin).
    // We'll attempt to call a hypothetical upstream admin reset route:
    const r = await fetch(`${API}/api/admin/dev/reset-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet }),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return NextResponse.json({ ok: false, status: r.status, error: txt }, { status: 500 });
    }

    const j = await r.json().catch(() => ({}));
    return NextResponse.json({ ok: true, result: j });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unexpected error" }, { status: 500 });
  }
}
