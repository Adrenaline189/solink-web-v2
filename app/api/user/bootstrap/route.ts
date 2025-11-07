import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // forward cookies (JWT) และ forward ref cookie ถ้ามี
  const cookie = cookies().toString();
  const h = headers();
  const refCookie = h.get("cookie") || "";

  const body = await req.json().catch(() => ({}));

  const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/user/bootstrap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie, // ส่ง JWT cookie ไป backend
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await r.text();
  const res = new NextResponse(text, { status: r.status });
  res.headers.set("content-type", r.headers.get("content-type") || "application/json");
  return res;
}
