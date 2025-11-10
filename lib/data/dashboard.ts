import type {
  DashboardSummary,
  HourlyPoint,
  Tx,
  Range,
  DashboardSummaryResponse,
  HourlyResponse,
  TransactionsResponse,
  coerceSummary,
  coerceHourly,
  coerceTx,
} from "@/types/dashboard";

/**
 * Unified JSON fetch helper with robust error handling.
 */
async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
  return (await res.json()) as T;
}

/**
 * Fetch dashboard summary data (points, uptime, QF, etc.)
 */
export async function fetchDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  try {
    const data = await getJson<DashboardSummaryResponse>("/api/dashboard/summary", signal);
    if (data.ok && data.data) return coerceSummary(data.data);
    throw new Error(data.error || "Malformed summary");
  } catch (e) {
    console.error("[fetchDashboardSummary]", e);
    throw e;
  }
}

/**
 * Fetch hourly points data.
 * @param range - "today" | "7d" | "30d"
 */
export async function fetchHourly(range: Range, signal?: AbortSignal): Promise<HourlyPoint[]> {
  const q = new URLSearchParams({ range });
  try {
    const data = await getJson<HourlyResponse>(`/api/dashboard/hourly?${q}`, signal);
    if (data.ok && data.data) return coerceHourly(data.data);
    throw new Error(data.error || "Malformed hourly data");
  } catch (e) {
    console.error("[fetchHourly]", e);
    throw e;
  }
}

/**
 * Fetch recent transaction history for the dashboard.
 */
export async function fetchTransactions(range: Range, signal?: AbortSignal): Promise<Tx[]> {
  const q = new URLSearchParams({ range });
  try {
    const data = await getJson<TransactionsResponse>(`/api/dashboard/transactions?${q}`, signal);
    if (data.ok && data.data) return coerceTx(data.data);
    throw new Error(data.error || "Malformed transactions");
  } catch (e) {
    console.error("[fetchTransactions]", e);
    throw e;
  }
}

/**
 * Local mock fallback (useful for dev/test mode when API unavailable).
 * Automatically returns fake but coherent data.
 */
export const MockDashboard = {
  async summary(): Promise<DashboardSummary> {
    return {
      pointsToday: 820,
      totalPoints: 124_550,
      slk: 1245,
      uptimeHours: 10,
      goalHours: 12,
      avgBandwidthMbps: 86,
      qf: 78,
      trust: 84,
      region: "ap-southeast-1",
      ip: "203.0.113.10",
      version: "v3.2.1",
    };
  },

  async hourly(range: Range): Promise<HourlyPoint[]> {
    const now = new Date();
    const out: HourlyPoint[] = [];
    if (range === "today") {
      for (let h = 0; h < 24; h++) {
        const t = `${h.toString().padStart(2, "0")}:00`;
        out.push({ time: t, points: Math.round(40 + 20 * Math.sin(h / 3)), mbps: 50 + Math.random() * 30 });
      }
    } else {
      const days = range === "7d" ? 7 : 30;
      for (let i = 0; i < days; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        out.push({ ts: d.toISOString(), points: Math.round(600 + Math.random() * 400) });
      }
    }
    return out.reverse();
  },

  async transactions(): Promise<Tx[]> {
    const now = Date.now();
    return Array.from({ length: 8 }).map((_, i) => ({
      ts: new Date(now - i * 3600_000).toISOString(),
      type: ["Accrual", "Convert", "Referral"][i % 3],
      amount: Math.round(80 + Math.random() * 100),
      note: "Mock transaction for demo",
    }));
  },
};
