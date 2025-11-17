// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const COOKIE_NAME = "solink_auth";
const EXPIRES_SECONDS = 60 * 60 * 24 * 30; // 30 วัน

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // ถ้าไม่ได้ตั้งค่าไว้จะ error และ log ออกมาชัดเจน
    console.error("JWT_SECRET is not set");
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const wallet = typeof body.wallet === "string" ? body.wallet.trim() : "";

    if (!wallet) {
      return NextResponse.json(
        { ok: false, error: "wallet is required" },
        { status: 400 }
      );
    }

    const now = Math.floor(Date.now() / 1000);

    // payload JWT เก็บแค่ wallet แบบสั้น ๆ
    const token = await new SignJWT({ w: wallet })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(now)
      .setExpirationTime(now + EXPIRES_SECONDS)
      .sign(getSecretKey());

    // body ตอบกลับ
    const res = NextResponse.json({ ok: true, wallet });

    // ตั้ง cookie HttpOnly
    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // dev บน http ก็ยังเซ็ตได้
      sameSite: "lax",
      path: "/",
      maxAge: EXPIRES_SECONDS,
    });

    return res;
  } catch (e: any) {
    console.error("auth/login error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal error" },
      { status: 500 }
    );
  }
}
