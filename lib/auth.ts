import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { JWTPayload } from "jose";

const COOKIE_NAME = "solink_auth";

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
function getSecretKeyOrNull(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

/**
 * พยายามอ่าน wallet จาก JWT cookie (payload.w)
 * ถ้า JWT_SECRET ไม่ตั้ง หรือ verify ไม่ผ่าน → return null
 */
async function tryReadWalletFromJwt(token: string): Promise<string | null> {
  try {
    const key = getSecretKeyOrNull();
    if (!key) return null;

    const { payload } = await jwtVerify(token, key);
    const data = payload as JWTPayload & { w?: string };

    const wallet = typeof data.w === "string" ? data.w : null;
    return wallet || null;
  } catch {
    return null;
  }
}

/**
 * เดาแบบปลอดภัยว่า token น่าจะเป็น wallet ตรง ๆ ไหม
 * (Solana base58 มักยาว ~32-44 และไม่มีจุดคั่นแบบ JWT)
 */
function looksLikeWallet(s: string) {
  if (!s) return false;
  if (s.includes(".")) return false; // JWT มี 2 จุด
  if (s.length < 20 || s.length > 80) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(s);
}

export async function getAuthFromRequest(
  req: NextRequest
): Promise<{ wallet: string | null }> {
  try {
    // 1) อ่าน cookie solink_auth
    const token = req.cookies.get(COOKIE_NAME)?.value?.trim();
    if (token) {
      // 1.1) ลองอ่านแบบ JWT ก่อน
      const wJwt = await tryReadWalletFromJwt(token);
      if (wJwt) return { wallet: wJwt };

      // 1.2) fallback: บาง env อาจเซ็ต solink_auth เป็น wallet ตรง ๆ
      if (looksLikeWallet(token)) return { wallet: token };
    }

    // 2) fallback: cookie solink_wallet (เคยถูกเซ็ตจากฝั่ง client)
    const w2 = req.cookies.get("solink_wallet")?.value?.trim();
    if (w2 && looksLikeWallet(w2)) return { wallet: w2 };

    return { wallet: null };
  } catch {
    // อะไรผิดพลาด ถือว่า anonymous
    return { wallet: null };
  }
}

/* --------------------------------------------------------------------------
   3) Wrapper: getAuthContext (ใช้ใน API route อื่น ๆ)
-------------------------------------------------------------------------- */
export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const { wallet } = await getAuthFromRequest(req);
  if (!wallet) return null;
  return { wallet };
}

/* --------------------------------------------------------------------------
   4) Admin helper: requireAdmin
      - อ่าน wallet จาก cookie
      - เทียบกับ ADMIN_WALLETS หรือ ADMIN_WALLET
-------------------------------------------------------------------------- */
function getAdminWalletList(): string[] {
  // รองรับใหม่: ADMIN_WALLETS=wallet1,wallet2,...
  const multi = (process.env.ADMIN_WALLETS || "").trim();
  if (multi) {
    return multi
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  // รองรับเดิม: ADMIN_WALLET=walletเดียว
  const single = (process.env.ADMIN_WALLET || "").trim();
  if (single) return [single];

  return [];
}

export async function requireAdmin(req: NextRequest): Promise<AuthContext> {
  const ctx = await getAuthContext(req);
  if (!ctx?.wallet) {
    const e: any = new Error("Unauthorized");
    e.status = 401;
    throw e;
  }

  const admins = getAdminWalletList();
  if (admins.length === 0) {
    const e: any = new Error("ADMIN_WALLETS/ADMIN_WALLET not configured");
    e.status = 500;
    throw e;
  }

  if (!admins.includes(ctx.wallet)) {
    const e: any = new Error("Forbidden");
    e.status = 403;
    throw e;
  }

  return ctx;
}
