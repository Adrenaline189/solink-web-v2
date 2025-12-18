// lib/data/sharing.ts
export type SharingStatus = {
  ok: boolean;
  active: boolean;
  reason?: string;
};

export async function fetchSharingStatus(): Promise<SharingStatus> {
  const res = await fetch("/api/sharing/status", { cache: "no-store" });
  return res.json();
}

export async function toggleSharing(active?: boolean): Promise<SharingStatus> {
  const res = await fetch("/api/sharing/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(typeof active === "boolean" ? { active } : {}),
  });
  return res.json();
}

export async function sendTestHeartbeat(payload?: {
  uptimeSeconds?: number;
  downloadMbps?: number;
  uploadMbps?: number;
  latencyMs?: number;
}) {
  const res = await fetch("/api/sharing/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uptimeSeconds: 60,
      downloadMbps: 120,
      uploadMbps: 40,
      latencyMs: 15,
      ...(payload ?? {}),
    }),
  });
  return res.json();
}
