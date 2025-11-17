import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "solink_auth";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");
  return new TextEncoder().encode(secret);
}

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const token = cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ ok: false, user: null });
    }

    const { payload } = await jwtVerify(token, getSecretKey());
    const wallet = payload.w;

    if (!wallet) {
      return NextResponse.json({ ok: false, user: null });
    }

    return NextResponse.json({
      ok: true,
      user: { wallet },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, user: null });
  }
}
