export type { Range } from "@/types/dashboard";
import type { DashboardSummary, HourlyPoint, Tx } from "@/types/dashboard";
export type Range = "today" | "7d" | "30d";

/** Safe JSON fetcher that guards empty body and non-OK responses. */
async function fetchJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} from ${url}: ${text.slice(0, 140)}`);
  }
  const text = await res.text();
  if (!text) {
    // unify empty as null/undefined depending on T
    throw new Error(`Empty JSON body from ${url}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 140)}`);
  }
}

export function fetchDashboardSummary(signal?: AbortSignal) {
  return fetchJSON<DashboardSummary>("/api/dashboard/summary", signal);
}

export function fetchHourly(range: Range, signal?: AbortSignal) {
  const q = new URLSearchParams({ range }).toString();
  return fetchJSON<HourlyPoint[]>(`/api/dashboard/hourly?${q}`, signal);
}

export function fetchTransactions(range: Range, signal?: AbortSignal) {
  const q = new URLSearchParams({ range }).toString();
  return fetchJSON<Tx[]>(`/api/dashboard/transactions?${q}`, signal);
}
