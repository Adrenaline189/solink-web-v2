// lib/auth.ts
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { JWTPayload } from "jose";

const COOKIE_NAME = "solink_auth";
const EXPIRES_SECONDS = 60 * 60 * 24 * 30;

/* --------------------------------------------------------------------------
   1) API Key Auth (ของเดิม — ใช้สำหรับ cron, admin)
-------------------------------------------------------------------------- */
export function requireApiKey(req: NextRequest) {
  const header = req.headers.get("x-api-key") || req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : header;

  if (!process.env.API_KEY) throw new Error("API_KEY is not configured");

  if (token !== process.env.API_KEY) {
    const e: any = new Error("Unauthorized");
    e.status = 401;
    throw e;
  }
}

/* --------------------------------------------------------------------------
   2) JWT Helper สำหรับอ่าน wallet จาก cookie solink_auth
-------------------------------------------------------------------------- */
function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");
  return new TextEncoder().encode(secret);
}

export async function getAuthFromRequest(
  req: NextRequest
): Promise<{ wallet: string | null }> {
  try {
    // อ่าน cookie ชื่อ solink_auth
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return { wallet: null };

    const { payload } = await jwtVerify(token, getSecretKey());
    const data = payload as JWTPayload & { w?: string };

    const wallet = typeof data.w === "string" ? data.w : null;
    return { wallet: wallet || null };
  } catch {
    // token ไม่ valid / หมดอายุ / verify ไม่ผ่าน → ถือว่า anonymous
    return { wallet: null };
  }
}
