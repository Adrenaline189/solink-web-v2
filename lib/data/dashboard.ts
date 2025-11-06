// lib/data/dashboard.ts
"use client";

import { API_BASE } from "@/lib/env"; // ถ้าไม่มี alias "@/..." ให้ใช้ "../lib/env"

export type Range = "today" | "7d" | "30d";

export interface DashboardSummary {
  pointsToday: number;
  totalPoints: number;
  slk: number;
  uptimeHours: number;
  goalHours: number;
  avgBandwidthMbps: number;
  qf: number;
  trust: number;
  region?: string;
  ip?: string;
  version?: string;
}

export interface HourlyPoint { ts: string; points: number }
export interface Tx { ts: string; type: string; amount: number; note?: string }

export async function fetchDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  const r = await fetch(`${API_BASE}/api/dashboard/summary`, { signal, credentials: "include" });
  if (!r.ok) throw new Error("Failed to load summary");
  return r.json();
}

export async function fetchHourly(range: Range, signal?: AbortSignal): Promise<HourlyPoint[]> {
  const r = await fetch(`${API_BASE}/api/dashboard/hourly?range=${range}`, { signal, credentials: "include" });
  if (!r.ok) throw new Error("Failed to load hourly");
  return r.json();
}

export async function fetchTransactions(range: Range, signal?: AbortSignal): Promise<Tx[]> {
  const r = await fetch(`${API_BASE}/api/dashboard/tx?range=${range}`, { signal, credentials: "include" });
  if (!r.ok) throw new Error("Failed to load transactions");
  return r.json();
}
