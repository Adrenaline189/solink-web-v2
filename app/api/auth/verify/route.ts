import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const body = await req.json();
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  const res = new NextResponse(text, { status: r.status });
  const setCookie = r.headers.get("set-cookie");
  if (setCookie) res.headers.set("set-cookie", setCookie);
  res.headers.set("content-type", r.headers.get("content-type") || "application/json");
  return res;
}
