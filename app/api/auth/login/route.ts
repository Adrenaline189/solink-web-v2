// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

const COOKIE_NAME = "solink_auth";
const EXPIRES_SECONDS = 60 * 60 * 24 * 30; // 30 วัน

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function POST(req: Request) {
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
    const payload = { w: wallet };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(now)
      .setExpirationTime(now + EXPIRES_SECONDS)
      .sign(getSecretKey());

    const res = NextResponse.json({ ok: true });

    // ตั้ง cookie HttpOnly
    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: EXPIRES_SECONDS,
    });

    return res;
  } catch (e) {
    console.error("auth/login error:", e);
    return NextResponse.json(
      { ok: false, error: "internal error" },
      { status: 500 }
    );
  }
}
