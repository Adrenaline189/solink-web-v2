// lib/data/dashboard.ts (ตัวอย่างฟังก์ชันให้ดูโครง)
import type { DashboardRange, HourlyPoint, Tx } from "@/types/dashboard";

export async function fetchHourly(
  range: DashboardRange,
  signal?: AbortSignal
): Promise<HourlyPoint[]> {
  const res = await fetch(`/api/dashboard/hourly?range=${range}`, {
    method: "GET",
    cache: "no-store",
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
    signal,
  });

  if (!res.ok) return [];

  const json = await res.json();
  return Array.isArray(json.items) ? (json.items as Tx[]) : [];
}
