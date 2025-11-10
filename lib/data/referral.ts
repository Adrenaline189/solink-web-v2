// lib/data/referral.ts
export type ReferralStats = {
  referredCount: number;   // จำนวนคนที่รับคำเชิญและเริ่มใช้งาน
  bonusTotal: number;      // แต้มรวมจาก referral
};

export async function fetchReferralStats(signal?: AbortSignal): Promise<ReferralStats | null> {
  try {
    const res = await fetch("/api/referral", { signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as ReferralStats;
  } catch {
    return null; // ให้หน้าไม่พัง ถ้าดึงไม่ได้ส่ง null กลับ
  }
}
