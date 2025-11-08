// lib/data/dashboard.ts
export type Range = "today" | "7d" | "30d";

const getWallet = () => {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\\s*)solink_wallet=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
};

export async function fetchDashboardSummary(signal?: AbortSignal) {
  const wallet = getWallet();
  const res = await fetch(`/api/dashboard/summary?wallet=${encodeURIComponent(wallet)}`, {
    signal,
    cache: "no-store",
  });
  const j = await res.json();
  return j.data as {
    pointsToday: number;
    totalPoints: number;
    slk: number;
    uptimeHours: number;
    goalHours: number;
    avgBandwidthMbps: number;
    qf: number;
    trust: number;
    region: string | null;
    ip: string | null;
    version: string | null;
  };
}

export async function fetchHourly(range: Range, signal?: AbortSignal) {
  const wallet = getWallet();
  const res = await fetch(
    `/api/dashboard/hourly?wallet=${encodeURIComponent(wallet)}&range=${range}`,
    { signal, cache: "no-store" }
  );
  const j = await res.json();
  return (j.data ?? []) as Array<{ ts: string; points: number }>;
}

export async function fetchTransactions(range: Range, signal?: AbortSignal) {
  const wallet = getWallet();
  const res = await fetch(
    `/api/dashboard/tx?wallet=${encodeURIComponent(wallet)}&range=${range}`,
    { signal, cache: "no-store" }
  );
  const j = await res.json();
  return (j.data ?? []) as Array<{ ts: string; type: string; amount: number; note: string }>;
}
