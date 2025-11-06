import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

function apiBase() {
  return process.env.NEXT_PUBLIC_API_BASE || "https://api-solink.network";
}

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const token = cookie.match(/solink_token=([^;]+)/)?.[1];

  if (token) {
    const r = await fetch(`${apiBase()}/api/points/referral/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (r.ok) {
      const j = await r.json().catch(() => null);
      if (j?.ok) return NextResponse.json(j);
    }
  }
  // demo fallback
  return NextResponse.json({ ok: true, bonusTotal: 420, referredCount: 5 });
}
