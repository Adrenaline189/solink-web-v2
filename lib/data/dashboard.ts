import type { DashboardRange, HourlyPoint, Tx } from "@/types/dashboard";

/** helper */
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** ---------------------------
 * Hourly Points (User)
 * -------------------------- */
export async function fetchHourly(
  range: DashboardRange,
  signal?: AbortSignal
): Promise<HourlyPoint[]> {
  try {
    const res = await fetch(`/api/dashboard/hourly?range=${range}`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      signal,
    });

    if (!res.ok) return [];
    const json: any = await safeJson(res);
    if (!json?.ok) return [];

    const arr =
      (Array.isArray(json?.items) && json.items) ||
      (Array.isArray(json?.hourly) && json.hourly) ||
      (Array.isArray(json?.series) && json.series) ||
      (Array.isArray(json?.data) && json.data) ||
      [];

    return arr
      .map((r: any) => {
        const ts =
          typeof r?.ts === "string"
            ? r.ts
            : typeof r?.hourUtc === "string"
            ? r.hourUtc
            : typeof r?.time === "string"
            ? r.time
            : null;

        const raw =
          r?.points != null ? r.points : r?.pointsEarned != null ? r.pointsEarned : r?.value;

        const points = typeof raw === "number" ? raw : Number(raw ?? 0);
        if (!ts) return null;
        return { ts, points: Number.isFinite(points) ? points : 0 } as HourlyPoint;
      })
      .filter(Boolean) as HourlyPoint[];
  } catch {
    return [];
  }
}

/** ---------------------------
 * Realtime Today Points (User)
 * -------------------------- */
export type DashboardRealtime = {
  ok: boolean;
  dayUtc: string;
  pointsToday: number;
  livePoints: number;
  rolledPoints: number;
};

export async function fetchRealtime(signal?: AbortSignal): Promise<DashboardRealtime> {
  const fallback: DashboardRealtime = {
    ok: false,
    dayUtc: new Date().toISOString(),
    pointsToday: 0,
    livePoints: 0,
    rolledPoints: 0,
  };

  try {
    const res = await fetch(`/api/dashboard/realtime`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      signal,
    });

    if (!res.ok) return fallback;
    const json: any = await safeJson(res);
    if (!json) return fallback;

    const ok = Boolean(json.ok);

    const dayUtc =
      typeof json.dayUtc === "string" && json.dayUtc.length
        ? json.dayUtc
        : new Date().toISOString();

    const pointsToday = Number(json.pointsToday ?? 0);
    const livePoints = Number(json.livePoints ?? 0);
    const rolledPoints = Number(json.rolledPoints ?? 0);

    return {
      ok,
      dayUtc,
      pointsToday: Number.isFinite(pointsToday) ? pointsToday : 0,
      livePoints: Number.isFinite(livePoints) ? livePoints : 0,
      rolledPoints: Number.isFinite(rolledPoints) ? rolledPoints : 0,
    };
  } catch {
    return fallback;
  }
}

/** ---------------------------
 * Transactions (User)
 * -------------------------- */
export async function fetchTransactions(
  range: DashboardRange,
  signal?: AbortSignal
): Promise<Tx[]> {
  try {
    const res = await fetch(`/api/dashboard/transactions?range=${range}`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      signal,
    });

    if (!res.ok) return [];
    const json: any = await safeJson(res);
    if (!json?.ok) return [];

    const arr =
      (Array.isArray(json?.items) && json.items) ||
      (Array.isArray(json?.transactions) && json.transactions) ||
      (Array.isArray(json?.txs) && json.txs) ||
      (Array.isArray(json?.data) && json.data) ||
      [];

    return arr as Tx[];
  } catch {
    return [];
  }
}

/** ---------------------------
 * Daily series normalizer (optional helper)
 * -------------------------- */
export type DailyPoint = { dayUtc: string; label: string; points: number };

export function normalizeDailySeries(json: any): DailyPoint[] {
  const src =
    (Array.isArray(json?.series) && json.series) ||
    (Array.isArray(json?.days) && json.days) ||
    (Array.isArray(json?.daily) && json.daily) ||
    (Array.isArray(json?.items) && json.items) ||
    [];

  const out = src
    .map((d: any) => {
      const dayUtc = typeof d?.dayUtc === "string" ? d.dayUtc : null;
      const label =
        typeof d?.label === "string" ? d.label : dayUtc ? dayUtc.slice(0, 10) : null;

      const raw = d?.points != null ? d.points : d?.pointsEarned != null ? d.pointsEarned : 0;
      const points = typeof raw === "number" ? raw : Number(raw ?? 0);

      if (!dayUtc || !label) return null;
      return { dayUtc, label, points: Number.isFinite(points) ? points : 0 } as DailyPoint;
    })
    .filter(Boolean) as DailyPoint[];

  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}
