// types/dashboard.ts

/**
 * Time range options used by dashboard data fetchers.
 */
export type Range = "today" | "7d" | "30d";

/**
 * High-level KPIs and environment info rendered on the dashboard.
 */
export type DashboardSummary = {
  /** Points accrued today (before daily cap). */
  pointsToday: number;
  /** Lifetime points. */
  totalPoints: number;
  /** Approx. token equivalent (SLK) derived from points or conversion rule. */
  slk: number;

  /** Uptime hours in current local day. */
  uptimeHours: number;
  /** Target hours to qualify for full rewards today. */
  goalHours: number;

  /** Average bandwidth over the recent window (e.g., 15 minutes). */
  avgBandwidthMbps: number;

  /** Quality Factor 0–100 (latency, jitter, session stability). */
  qf: number;
  /** Trust score 0–100 (device history, behavior, reputation). */
  trust: number;

  /** Optional environment/meta info. */
  region: string | null;
  ip: string | null;
  version: string | null;
};

/**
 * Hourly (or bucketed) points series used by the HourlyPoints chart.
 * Use either `ts` (ISO) or `time` (human label like "09:00").
 */
export type HourlyPoint = {
  ts?: string;     // ISO timestamp (preferred if available)
  time?: string;   // Fallback display label, e.g. "09:00"
  points: number;  // Points accrued in this bucket
  mbps?: number;   // Optional avg bandwidth for the bucket
};

/**
 * Recent transaction/activity feed row.
 */
export type Tx = {
  ts: string;     // ISO string or "YYYY-MM-DD HH:mm"
  type: string;   // e.g. "Accrual" | "Convert" | "Referral"
  amount: number; // positive or negative depending on event
  note: string;   // short description
};

/* -----------------------------------------------------------------------------
 * API DTOs (responses) — keep these small & serializable
 * ---------------------------------------------------------------------------*/
export type DashboardSummaryResponse = {
  ok: boolean;
  data?: DashboardSummary;
  error?: string;
};

export type HourlyResponse = {
  ok: boolean;
  data?: HourlyPoint[];
  error?: string;
};

export type TransactionsResponse = {
  ok: boolean;
  data?: Tx[];
  error?: string;
};

/* -----------------------------------------------------------------------------
 * Type guards (defensive at runtime for API responses)
 * ---------------------------------------------------------------------------*/
export function isDashboardSummary(x: unknown): x is DashboardSummary {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  const strOrNull = (v: unknown) => v == null || typeof v === "string";
  return (
    num(o.pointsToday) &&
    num(o.totalPoints) &&
    num(o.slk) &&
    num(o.uptimeHours) &&
    num(o.goalHours) &&
    num(o.avgBandwidthMbps) &&
    num(o.qf) &&
    num(o.trust) &&
    strOrNull(o.region) &&
    strOrNull(o.ip) &&
    strOrNull(o.version)
  );
}

export function isHourlyPoint(x: unknown): x is HourlyPoint {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const str = (v: unknown) => typeof v === "string";
  const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  const hasLabel = (o.ts == null || str(o.ts)) && (o.time == null || str(o.time));
  return hasLabel && num(o.points) && (o.mbps == null || num(o.mbps));
}

export function isTx(x: unknown): x is Tx {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.ts === "string" &&
    typeof o.type === "string" &&
    typeof o.note === "string" &&
    typeof o.amount === "number" &&
    Number.isFinite(o.amount)
  );
}

export function isHourlyResponse(x: unknown): x is HourlyResponse {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (o.ok !== true) return typeof o.ok === "boolean";
  if (o.data == null) return true;
  return Array.isArray(o.data) && o.data.every(isHourlyPoint);
}

export function isTransactionsResponse(x: unknown): x is TransactionsResponse {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (o.ok !== true) return typeof o.ok === "boolean";
  if (o.data == null) return true;
  return Array.isArray(o.data) && o.data.every(isTx);
}

export function isDashboardSummaryResponse(x: unknown): x is DashboardSummaryResponse {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (o.ok !== true) return typeof o.ok === "boolean";
  if (o.data == null) return true;
  return isDashboardSummary(o.data);
}

/* -----------------------------------------------------------------------------
 * Small helpers & defaults (pure & tree-shakeable)
 * ---------------------------------------------------------------------------*/
export const DEFAULT_RANGE: Range = "today";

export const EMPTY_SUMMARY: DashboardSummary = {
  pointsToday: 0,
  totalPoints: 0,
  slk: 0,
  uptimeHours: 0,
  goalHours: 0,
  avgBandwidthMbps: 0,
  qf: 0,
  trust: 0,
  region: null,
  ip: null,
  version: null,
};

export function coerceSummary(x: unknown): DashboardSummary {
  return isDashboardSummary(x) ? x : { ...EMPTY_SUMMARY };
}

export function coerceHourly(list: unknown): HourlyPoint[] {
  return Array.isArray(list) ? list.filter(isHourlyPoint) : [];
}

export function coerceTx(list: unknown): Tx[] {
  return Array.isArray(list) ? list.filter(isTx) : [];
}

/** Format helper for compact amounts (UI): 12,345 → "12,345" */
export function formatInt(n: number | undefined | null): string {
  return typeof n === "number" && Number.isFinite(n) ? n.toLocaleString() : "—";
}

/** Clamp percentage 0..100 (for meters). */
export function clampPct(n: number | undefined | null): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}
