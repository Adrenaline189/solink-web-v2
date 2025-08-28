// app/r/[code]/route.ts
import { NextResponse } from "next/server";

const COOKIE = "solink_ref";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 วัน

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  const url = new URL(req.url);
  const code = (params.code || "").slice(0, 64);
  // ปลายทางที่อยากให้ไปต่อ (เช่น / หรือหน้า landing เฉพาะ)
  const to = url.searchParams.get("to") || "/";

  const res = NextResponse.redirect(new URL(to, url.origin), { status: 307 });
  if (code) {
    res.cookies.set({
      name: COOKIE,
      value: code,
      maxAge: MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}
