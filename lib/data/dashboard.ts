// lib/data/dashboard.ts
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
 * GET /api/dashboard/hourly?range=today|7d|30d
 * (คงแบบเดิม เพราะของเดิมกราฟขึ้น)
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

    // รองรับหลาย shape
    const arr =
      (Array.isArray(json?.items) && json.items) ||
      (Array.isArray(json?.hourly) && json.hourly) ||
      (Array.isArray(json?.series) && json.series) ||
      (Array.isArray(json?.data) && json.data) ||
      [];

    const out: HourlyPoint[] = arr
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
          r?.points != null
            ? r.points
            : r?.pointsEarned != null
            ? r.pointsEarned
            : r?.value;

        const points = typeof raw === "number" ? raw : Number(raw ?? 0);
        if (!ts) return null;

        // NOTE: โครงสร้าง HourlyPoint ของโปรเจกต์คุณใช้ {ts, points}
        return { ts, points: Number.isFinite(points) ? points : 0 } as HourlyPoint;
      })
      .filter(Boolean) as HourlyPoint[];

    return out;
  } catch {
    return [];
  }
}

/** ---------------------------
 * Realtime Today Points (User)
 * GET /api/dashboard/realtime
 *
 * ✅ FIX: คืน shape ที่ page.tsx ต้องใช้ (มี ok/dayUtc)
 * เพื่อให้ `if (data && data.ok) ...` ไม่ error
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

    // route ของคุณส่ง { ok, dayUtc, pointsToday, livePoints, rolledPoints }
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
 * GET /api/dashboard/transactions?range=...
 * (คงแบบเดิม)
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

    // รองรับหลายชื่อ field
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
