import { NextResponse } from "next/server";
export async function GET() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/nonce`, { cache: "no-store" });
  const j = await r.json();
  return NextResponse.json(j, { status: r.status });
}
