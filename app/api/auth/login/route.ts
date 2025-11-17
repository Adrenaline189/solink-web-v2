import { NextResponse, NextRequest } from "next/server";
import { SignJWT } from "jose";

const COOKIE_NAME = "solink_auth";
const EXPIRES_SECONDS = 60 * 60 * 24 * 30;

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");
  return new TextEncoder().encode(secret);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wallet = (body.wallet || "").trim();
    if (!wallet) {
      return NextResponse.json({ ok: false, error: "wallet required" }, { status: 400 });
    }

    const token = await new SignJWT({ w: wallet })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(EXPIRES_SECONDS)
      .sign(getSecretKey());

    const res = NextResponse.json({ ok: true });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: EXPIRES_SECONDS,
    });

    return res;
  } catch (err) {
    console.error("login failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
