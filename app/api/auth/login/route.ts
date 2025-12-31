// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const wallet = String(body?.wallet || "").trim();

    if (!wallet) {
      return NextResponse.json({ ok: false, error: "wallet required" }, { status: 400 });
    }

    let user = await prisma.user.findFirst({ where: { wallet } });
    if (!user) {
      user = await prisma.user.create({ data: { wallet } });
    }

    const token = crypto
      .createHash("sha256")
      .update(`${wallet}:${Date.now()}:${process.env.AUTH_SECRET || "dev"}`)
      .digest("hex");

    const res = NextResponse.json(
      { ok: true, wallet, userId: user.id },
      { headers: { "Cache-Control": "no-store" } }
    );

    const isProd = process.env.NODE_ENV === "production";

    res.cookies.set("solink_wallet", wallet, {
      httpOnly: false,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    res.cookies.set("solink_auth", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (e: any) {
    console.error("auth/login error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "login failed" }, { status: 500 });
  }
}
