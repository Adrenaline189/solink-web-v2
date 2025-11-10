// scripts/lib/api.ts
// -------------------------------------------------------------
// Shared API helpers for AutoFarm (kept minimal)
// -------------------------------------------------------------
export type FarmType = "extension_farm";

export interface EarnResponse {
  ok: boolean;
  balance?: number;
  error?: string;
}

export interface LoginResponse {
  token?: string;
  ok?: boolean;
  error?: string;
}

export async function httpJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : {};
    return { res, json };
  } catch {
    return { res, json: { ok: false, error: `Invalid JSON: ${text.slice(0, 120)}` } };
  }
}

export async function demoLogin(baseUrl: string, wallet: string): Promise<string> {
  const url = `${baseUrl}/api/auth/demo-login`;
  const { res, json } = await httpJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet })
  });
  if (!res.ok) throw new Error(`demo-login failed (${res.status}) ${(json as any)?.error || ""}`.trim());
  const data = json as LoginResponse;
  if (!data?.token) throw new Error(`demo-login returned no token for wallet=${wallet}`);
  return data.token!;
}

export async function earnOnce(
  baseUrl: string,
  token: string,
  farmType: FarmType,
  amount: number
) {
  const url = `${baseUrl}/api/points/earn`;
  const { res, json } = await httpJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      type: farmType,
      amount,
      meta: { session: "scheduler" }
    })
  });
  return { res, json: json as EarnResponse };
}

export async function getBalance(baseUrl: string, token: string) {
  const url = `${baseUrl}/api/points/balance`;
  const { res, json } = await httpJson(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return undefined;
  return (json as any)?.balance as number | undefined;
}
