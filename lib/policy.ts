// lib/policy.ts
export type EarnType = "extension_farm" | "referral" | "convert";

export const DAILY_CAP = Number(process.env.DAILY_CAP_POINTS ?? 2000);

export const POLICY: Record<EarnType, { maxPerEvent: number; cooldownSec: number }> = {
  extension_farm: { maxPerEvent: 200, cooldownSec: 10 },
  referral:       { maxPerEvent: 200, cooldownSec: 0 },
  convert:        { maxPerEvent: 10_000, cooldownSec: 0 },
};
