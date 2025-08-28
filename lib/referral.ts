// lib/referral.ts
"use client";

const CODE_KEY = "solink_ref_code";
const COOKIE = "solink_ref";

export function getUserCode(address?: string | null) {
  if (address) return address.slice(2, 10);
  let code = localStorage.getItem(CODE_KEY);
  if (!code) {
    code = Math.random().toString(36).slice(2, 10);
    localStorage.setItem(CODE_KEY, code);
  }
  return code;
}

export function buildReferralLink(code: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://solink.network");
  return `${base.replace(/\/$/, "")}/r/${encodeURIComponent(code)}`;
}

// ---- server helpers (อ่านคุกกี้ฝั่ง server ได้สะดวก) ----
export type RefCookie = { code: string; at?: number };

export function parseRefCookie(raw?: string | null): RefCookie | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj.code === "string" && obj.code) return obj as RefCookie;
    return null;
  } catch {
    return null;
  }
}

export const REF_COOKIE_NAME = COOKIE;
