// lib/points.ts
export const EARN_TYPES = [
  "extension_farm",
  "UPTIME_MINUTE",
  "referral",
  "referral_bonus",
] as const;

export type PointEventType = (typeof EARN_TYPES)[number];

export function isEarnType(t: string | null | undefined): boolean {
  if (!t) return false;
  return (EARN_TYPES as readonly string[]).includes(t);
}
