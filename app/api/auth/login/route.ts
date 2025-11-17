// app/api/auth/login/route.ts
import { NextResponse, NextRequest } from "next/server";
import { SignJWT } from "jose";

const COOKIE_NAME = "solink_auth";
const EXPIRES_SECONDS = 60 * 60 * 24 * 30; // 30 วัน

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");
  return new TextEncoder().encode(secret);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const wallet = typeof body.wallet === "string" ? body.wallet.trim() : "";

    if (!wallet) {
      return NextResponse.json(
        { ok: false, error: "wallet required" },
        { status: 400 }
      );
    }

    const now = Math.floor(Date.now() / 1000);

    const token = await new SignJWT({ w: wallet })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(now)
      .setExpirationTime(now + EXPIRES_SECONDS) // ✅ correct: now + อายุ
      .sign(getSecretKey());

    const res = NextResponse.json({ ok: true });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,      // localhost จะไม่เห็น cookie ถ้าใช้ http แต่บน https ของจริงใช้ได้
      sameSite: "lax",
      path: "/",
      maxAge: EXPIRES_SECONDS,
    });

    return res;
  } catch (err) {
    console.error("login failed:", err);
    return NextResponse.json({ ok: false, error: "internal error" }, { status: 500 });
  }
}
