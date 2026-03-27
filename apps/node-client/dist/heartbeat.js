/**
 * heartbeat.ts — sends a sharing heartbeat to the Solink API
 */
import { getPublicKey } from "./wallet.js";
// @ts-ignore - fetch is available in Node 18+
import { fetch } from "undici";
const API_BASE = process.env.SOLINK_API_URL ?? "https://api.solink.network";
/**
 * Send a heartbeat to the API.
 * The API handles wallet auth via cookie (browser) or ?wallet= (CLI).
 */
export async function sendHeartbeat(bandwidth) {
    const wallet = getPublicKey();
    if (!wallet) {
        return { ok: false, awarded: 0, error: "No wallet connected" };
    }
    const body = {
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
        const json = await res.json();
        if (!res.ok || !json.ok) {
            return {
                ok: false,
                awarded: 0,
                error: json?.error ?? `HTTP ${res.status}`,
            };
        }
        return {
            ok: true,
            awarded: json.awarded ?? 0,
            balance: json.balance,
        };
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {
            ok: false,
            awarded: 0,
            error: msg,
        };
    }
}
