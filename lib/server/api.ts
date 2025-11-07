// lib/server/api.ts
import { cookies, headers } from "next/headers";

const DEFAULT_BASE = "https://api-solink.network";

export function getApiBase() {
  const env = process.env.NEXT_PUBLIC_API_BASE?.trim();
  return env && /^https?:\/\//.test(env) ? env.replace(/\/$/, "") : DEFAULT_BASE;
}

export function getAuthHeader() {
  // 1) อ่านจากคุกกี้ (เช่น คุณเซ็ต 'solink_jwt' ไว้)
  const jar = cookies();
  const jwt = jar.get("solink_jwt")?.value;

  // 2) เผื่อมีการ forward header Authorization มาจาก client (เช่นผ่าน middleware)
  const h = headers();
  const fwdAuth = h.get("x-forwarded-authorization") || h.get("authorization");

  // 3) หรือ DEMO_JWT จาก ENV (ใช้งานชั่วคราว)
  const demo = process.env.NEXT_PUBLIC_DEMO_JWT;

  const token = jwt || fwdAuth?.replace(/^Bearer\s+/i, "") || demo;
  return token ? `Bearer ${token}` : "";
}

export async function apiGet<T>(path: string, init?: RequestInit) {
  const base = getApiBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const auth = getAuthHeader();

  const res = await fetch(url, {
    ...init,
    method: "GET",
    headers: {
      ...(init?.headers || {}),
      ...(auth ? { Authorization: auth } : {}),
      "Content-Type": "application/json",
    },
    cache: "no-store",
    // IMPORTANT: อย่าใช้ next: { revalidate } เพื่อให้ดึงค่าปัจจุบันเสมอ
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Upstream ${res.status} ${res.statusText} ${txt}`);
  }
  return (await res.json()) as T;
}
