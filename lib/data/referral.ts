// lib/data/referral.ts
export type ReferralStats = { bonusTotal: number; referredCount: number };

export async function fetchReferralStats(signal?: AbortSignal): Promise<ReferralStats> {
  const r = await fetch("/api/referral", { signal, cache: "no-store" });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  if (j?.ok)
    return {
      bonusTotal: j.bonusTotal ?? 0,
      referredCount: j.referredCount ?? 0,
    };
  return { bonusTotal: 0, referredCount: 0 };
}
