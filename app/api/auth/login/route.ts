// app/api/auth/login/route.ts
import { NextResponse, NextRequest } from "next/server";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

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

    // 1) หา / สร้าง User จาก wallet address
    const user = await prisma.user.upsert({
      where: { wallet },
      update: {},
      create: { wallet },
    });

    const now = Math.floor(Date.now() / 1000);

    // 2) สร้าง JWT เหมือนของเดิม (เก็บ wallet ไว้ใน token)
    const token = await new SignJWT({ w: wallet })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(now)
      .setExpirationTime(now + EXPIRES_SECONDS)
      .sign(getSecretKey());

    // 3) สร้าง response + set cookies
    const res = NextResponse.json({ ok: true, userId: user.id });

    // cookie auth เดิม (ใช้ httpOnly)
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ให้ localhost ใช้ได้
      sameSite: "lax",
      path: "/",
      maxAge: EXPIRES_SECONDS,
    });

    // cookie ที่ฝั่ง sharing / heartbeat ใช้ (อ่านได้จาก server + browser)
    res.cookies.set("solink_wallet", wallet, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: EXPIRES_SECONDS,
    });

    return res;
  } catch (err) {
    console.error("login failed:", err);
    return NextResponse.json(
      { ok: false, error: "internal error" },
      { status: 500 }
    );
  }
}
