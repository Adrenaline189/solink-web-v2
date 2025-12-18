export type SharingStatus = {
  ok: boolean;
  active: boolean;
  reason?: string;
};

export async function getSharingStatus(): Promise<SharingStatus> {
  const r = await fetch("/api/sharing/status", { cache: "no-store" });
  return r.json();
}

export async function setSharingActive(active: boolean): Promise<SharingStatus> {
  const r = await fetch("/api/sharing/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active }),
  });
  return r.json();
}
