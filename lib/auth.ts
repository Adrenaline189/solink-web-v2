// lib/auth.ts
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { JWTPayload } from "jose";

const COOKIE_NAME = "solink_auth";
const EXPIRES_SECONDS = 60 * 60 * 24 * 30;

/* --------------------------------------------------------------------------
   Types
-------------------------------------------------------------------------- */
export type AuthContext = {
  wallet: string;
};

/* --------------------------------------------------------------------------
   1) API Key Auth (เดิม — ใช้สำหรับ cron, admin script ฝั่ง server)
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

/* --------------------------------------------------------------------------
   3) Wrapper: getAuthContext (ใช้ใน API route อื่น ๆ)
-------------------------------------------------------------------------- */
/**
 * ใช้ใน API routes ทั่วไป
 * - ถ้าไม่มี wallet → คืน null (ให้ route ไปตอบ 401 เอง)
 * - ถ้ามี wallet → คืน AuthContext ที่มี wallet แน่นอน
 */
export async function getAuthContext(
  req: NextRequest
): Promise<AuthContext | null> {
  const { wallet } = await getAuthFromRequest(req);
  if (!wallet) return null;
  return { wallet };
}

/* --------------------------------------------------------------------------
   4) Admin helper: requireAdmin
      - อ่าน wallet จาก cookie
      - เทียบกับ ADMIN_WALLET ใน env
-------------------------------------------------------------------------- */
export async function requireAdmin(req: NextRequest): Promise<AuthContext> {
  const ctx = await getAuthContext(req);
  if (!ctx?.wallet) {
    const e: any = new Error("Unauthorized");
    e.status = 401;
    throw e;
  }

  const adminWallet = (process.env.ADMIN_WALLET || "").trim();
  if (!adminWallet) {
    const e: any = new Error("ADMIN_WALLET not configured");
    e.status = 500;
    throw e;
  }

  if (ctx.wallet !== adminWallet) {
    const e: any = new Error("Forbidden");
    e.status = 403;
    throw e;
  }

  return ctx;
}
