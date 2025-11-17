// lib/auth.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

/* --------------------------------------------------------------------------
   1) API Key Auth (ของเดิม — ใช้สำหรับ cron, admin)
   -------------------------------------------------------------------------- */
export function requireApiKey(req: NextRequest) {
  const header = req.headers.get("x-api-key") || req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : header;

  if (!process.env.API_KEY) throw new Error("API_KEY is not configured");

  if (token !== process.env.API_KEY) {
    const e = new Error("Unauthorized");
    // @ts-ignore
    e.status = 401;
    throw e;
  }
}

/* --------------------------------------------------------------------------
   2) JWT Auth (User login) 
   - ใช้ cookie: solink_auth 
   -------------------------------------------------------------------------- */
export const AUTH_COOKIE_NAME = "solink_auth";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

/* type ของ user ที่ login */
export type AuthContext = {
  wallet: string;
};

/* --------------------------------------------------------------------------
   3) อ่าน JWT จาก cookie → คืน wallet ถ้าถูกต้อง
   -------------------------------------------------------------------------- */
export async function getAuthContext(
  req: NextRequest
): Promise<AuthContext | null> {
  const cookie = req.cookies.get(AUTH_COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    const { payload } = await jwtVerify(cookie.value, getSecretKey());

    const w =
      (payload as JWTPayload & { w?: string; wallet?: string }).w ||
      (payload as any).wallet;

    if (!w || typeof w !== "string") return null;

    return { wallet: w };
  } catch (err) {
    console.warn("getAuthContext: invalid token", err);
    return null;
  }
}

/* --------------------------------------------------------------------------
   4) Require login ใน API (ต้องมี cookie เท่านั้นถึงจะผ่าน)
   -------------------------------------------------------------------------- */
export async function requireAuth(
  req: NextRequest
): Promise<{ ctx?: AuthContext; res?: NextResponse }> {
  const ctx = await getAuthContext(req);
  if (!ctx) {
    const res = NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
    return { res };
  }
  return { ctx };
}
