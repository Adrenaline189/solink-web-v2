// lib/data/dashboard.ts
import type { DashboardRange, HourlyPoint, Tx, DashboardRealtime } from "@/types/dashboard";

export async function fetchHourly(
  range: DashboardRange,
  signal?: AbortSignal
): Promise<HourlyPoint[]> {
  const res = await fetch(`/api/dashboard/hourly?range=${range}`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    signal,
  });

  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.items) ? (json.items as HourlyPoint[]) : [];
}

export async function fetchTransactions(
  range: DashboardRange,
  signal?: AbortSignal
): Promise<Tx[]> {
  const res = await fetch(`/api/dashboard/transactions?range=${range}`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    signal,
  });

  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.items) ? (json.items as Tx[]) : [];
}

export async function fetchRealtime(signal?: AbortSignal): Promise<DashboardRealtime> {
  const res = await fetch(`/api/dashboard/realtime`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    signal,
  });

  const json = await res.json().catch(() => null);
  return (json ?? { ok: false, pointsToday: 0, livePoints: 0, rolledPoints: 0, dayUtc: "" }) as DashboardRealtime;
}
