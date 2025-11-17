"use client";

import { useEffect, useState } from "react";

/* -------------------------------------------
   Constants
-------------------------------------------- */

const CODE_KEY = "solink_ref_code"; // fallback สำหรับ anonymous user
export const REF_COOKIE_NAME = "solink_ref";

/* -------------------------------------------
   Client: Fallback referral code (no wallet)
-------------------------------------------- */

export function getLocalFallbackCode() {
  let code = localStorage.getItem(CODE_KEY);
  if (!code) {
    code = Math.random().toString(36).slice(2, 10);
    localStorage.setItem(CODE_KEY, code);
  }
  return code;
}

/* -------------------------------------------
   Client: Build referral link
-------------------------------------------- */

export function buildReferralLink(code: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://solink.network");

  return `${base.replace(/\/$/, "")}/r/${encodeURIComponent(code)}`;
}

/* -------------------------------------------
   Server helper: parse referral cookie
-------------------------------------------- */

export type RefCookie = {
  code: string;
  at?: number;
};

export function parseRefCookie(raw?: string | null): RefCookie | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj.code === "string" && obj.code) {
      return obj as RefCookie;
    }
    return null;
  } catch {
    return null;
  }
}

/* -------------------------------------------
   NEW: Fetch referral code from server (DB)
   ใช้เมื่อ user connect wallet
-------------------------------------------- */

export async function fetchReferralCodeFromServer(wallet: string): Promise<string | null> {
  try {
    const res = await fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json.code ?? null;
  } catch (e) {
    console.error("fetchReferralCodeFromServer error:", e);
    return null;
  }
}

/* -------------------------------------------
   React Hook: ใช้ที่ Dashboard เพื่อรับ code จริง
-------------------------------------------- */

export function useReferralCode(wallet?: string | null) {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (wallet) {
      // Fetch from backend/DB
      fetchReferralCodeFromServer(wallet).then((c) => {
        if (c) setCode(c);
      });
    } else {
      // Anonymous user → fallback local random
      setCode(getLocalFallbackCode());
    }
  }, [wallet]);

  return code;
}
