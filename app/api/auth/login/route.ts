// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { SignJWT } from "jose";

const AUTH_COOKIE = "solink_auth";
const AUTH_TTL_SEC = 60 * 60 * 24 * 7; // 7 วัน

function getJwtSecret() {
  const raw = process.env.AUTH_SECRET || process.env.JWT_SECRET || "dev-change-me";
  return new TextEncoder().encode(raw);
}

function buildLoginMessage(wallet: string, ts: number) {
  // ต้องใช้ format เดียวกับฝั่ง client
  return `Solink Login :: wallet=${wallet} :: ts=${ts}`;
}

function base64ToUint8Array(b64: string): Uint8Array {
  const buf = Buffer.from(b64, "base64");
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

export async function POST(req: Request) {
  try {
    const { wallet, ts, signature } = await req.json();

    if (!wallet || !ts || !signature) {
      return NextResponse.json(
        { ok: false, error: "Missing wallet/ts/signature" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const diff = Math.abs(now - Number(ts));

    // กัน replay login เก่ามาก ๆ (เกิน 5 นาที)
    if (diff > 5 * 60 * 1000) {
      return NextResponse.json(
        { ok: false, error: "Login request expired" },
        { status: 400 }
      );
    }

    // สร้าง message ที่ควรจะถูกเซ็น
    const msg = buildLoginMessage(wallet, Number(ts));
    const msgBytes = new TextEncoder().encode(msg);

    // decode signature ที่ส่งมาจาก client
    const sigBytes = base64ToUint8Array(signature);

    // แปลง wallet เป็น public key bytes
    const pubkey = new PublicKey(wallet);
    const pubkeyBytes = pubkey.toBytes();

    // verify ลายเซ็น
    const ok = nacl.sign.detached.verify(msgBytes, sigBytes, pubkeyBytes);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    // upsert user ตาม wallet
    const user = await prisma.user.upsert({
      where: { wallet },
      create: { wallet },
      update: {},
    });

    // สร้าง JWT
    const secret = getJwtSecret();
    const token = await new SignJWT({
      sub: user.id,
      wallet,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${AUTH_TTL_SEC}s`)
      .sign(secret);

    // ส่ง cookie กลับไป
    const res = NextResponse.json({ ok: true, userId: user.id, wallet });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_TTL_SEC,
    });

    return res;
  } catch (e: any) {
    console.error("auth/login error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}
