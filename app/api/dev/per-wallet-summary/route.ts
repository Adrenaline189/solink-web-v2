// app/api/dev/per-wallet-summary/route.ts
import { NextRequest, NextResponse } from "next/server";

const API = process.env.SOLINK_API_URL || "https://api-solink.network";

async function demoLogin(wallet: string) {
  const r = await fetch(`${API}/api/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet }),
    cache: "no-store",
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`demo-login failed for ${wallet}: ${r.status} ${txt}`);
  }
  const j = await r.json();
  return j.token as string;
}

async function fetchSummary(token: string) {
  // NOTE: adjust path if your backend uses a different summary endpoint.
  // This tries /api/users/me/summary (common). If it fails, returns raw status/text.
  const r = await fetch(`${API}/api/users/me/summary`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const txt = await r.text();
  try {
    return { ok: r.ok, status: r.status, body: JSON.parse(txt) };
  } catch {
    return { ok: r.ok, status: r.status, text: txt };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { wallets = ["demo_wallet"] } = body || {};

    if (!Array.isArray(wallets) || wallets.length === 0) {
      return NextResponse.json({ ok: false, error: "wallets[] required" }, { status: 400 });
    }

    const out: Record<string, any> = {};
    await Promise.all(
      wallets.map(async (w: string) => {
        try {
          const token = await demoLogin(w);
          const summary = await fetchSummary(token);
          out[w] = summary;
        } catch (err: any) {
          out[w] = { ok: false, error: String(err?.message || err) };
        }
      })
    );

    return NextResponse.json({ ok: true, wallets: out });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unexpected error" }, { status: 500 });
  }
}
