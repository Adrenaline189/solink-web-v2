/**
 * heartbeat.ts — sends a sharing heartbeat to the Solink API
 */

import { getPublicKey } from "./wallet.js";
// @ts-ignore - fetch is available in Node 18+
import { fetch } from "undici";

const API_BASE = process.env.SOLINK_API_URL ?? "https://api.solink.network";

export type HeartbeatBody = {
  uptimeSeconds: number;
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
};

export type HeartbeatResult = {
  ok: boolean;
  awarded: number;
  reason?: string;
  balance?: number;
  error?: string;
};

/**
 * Send a heartbeat to the API.
 * The API handles wallet auth via cookie (browser) or ?wallet= (CLI).
 */
export async function sendHeartbeat(bandwidth: {
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  uptimeSeconds?: number;
}): Promise<HeartbeatResult> {
  const wallet = getPublicKey();
  if (!wallet) {
    return { ok: false, awarded: 0, error: "No wallet connected" };
  }

  const body: HeartbeatBody = {
    uptimeSeconds: bandwidth.uptimeSeconds ?? 60,
    downloadMbps: bandwidth.downloadMbps,
    uploadMbps: bandwidth.uploadMbps,
    latencyMs: bandwidth.latencyMs,
  };

  try {
    const walletAddr = wallet.toBase58();
    const targetUrl = `${API_BASE}/api/sharing/heartbeat?wallet=${encodeURIComponent(walletAddr)}`;

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json() as HeartbeatResult;

    if (!res.ok || !json.ok) {
      return {
        ok: false,
        awarded: 0,
        error: (json as any)?.error ?? `HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      awarded: (json as any).awarded ?? 0,
      balance: (json as any).balance,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e); // @ts-ignore
    return {
      ok: false,
      awarded: 0,
      error: msg,
    };
  }
}
