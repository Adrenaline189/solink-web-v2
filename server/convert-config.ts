"use server";

import { prisma } from "@/lib/prisma";

/* ============================================================
   A) Convert Config (ของเดิม)
   ============================================================ */

export type ConvertConfig = {
  enabled: boolean;
};

// userId ว่าง "" ใช้เป็นระบบ global setting เดิม
const SYSTEM_USER_ID = "";

// helper: แปลง string → boolean
function parseBool(v: string | null | undefined, defaultValue: boolean): boolean {
  if (!v) return defaultValue;
  const s = v.toLowerCase().trim();
  if (["true", "1", "yes", "on"].includes(s)) return true;
  if (["false", "0", "no", "off"].includes(s)) return false;
  return defaultValue;
}

/**
 * อ่าน config convert_enabled จาก DB
 * fallback ไปที่ ENV ถ้าไม่เจอ
 */
export async function getConvertConfig(): Promise<ConvertConfig> {
  try {
    const setting = await prisma.setting.findUnique({
      where: {
        userId_key: {
          userId: SYSTEM_USER_ID,
          key: "convert_enabled",
        },
      },
    });

    if (setting) {
      const enabled = parseBool(setting.value, true);
      return { enabled };
    }
  } catch (e) {
    console.error("[convert-config] failed to read Setting:", e);
  }

  const envRaw = process.env.CONVERT_ENABLED ?? "true";
  const enabled = parseBool(envRaw, true);
  return { enabled };
}

/* ============================================================
   Helper ทั่วไป
   ============================================================ */

const DAY_MS = 1000 * 60 * 60 * 24;

// จำกัดค่าให้อยู่ในช่วง 0–1
function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

// คืนค่าเวลา 00:00:00 ของวันนั้น (UTC)
function startOfUtcDay(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/* ============================================================
   B) QF (Quality Factor) CONFIG + ฟังก์ชันคำนวณ
   ============================================================ */

export const QF_CONFIG = {
  GOAL_UPTIME_PCT: 80, // uptime 80% ขึ้นไปถือว่าถึงเป้า
  BW_MIN_GOOD: 10,     // ต่ำกว่า 10 Mbps = ไม่ได้คะแนน bandwidth
  BW_MAX_CAP: 100,     // 100 Mbps ขึ้นไป = ได้เต็ม
};

/**
 * คำนวณ QF (0–100)
 * uptime 70% + bandwidth 30%
 */
export function computeQualityFactor(
  uptimePct: number | null | undefined,
  avgBandwidth: number | null | undefined
): number {
  const u = uptimePct ?? 0;
  const bw = avgBandwidth ?? 0;

  const { GOAL_UPTIME_PCT, BW_MIN_GOOD, BW_MAX_CAP } = QF_CONFIG;

  // 1) uptime (70 คะแนน)
  const uptimeRatio = clamp01(u / GOAL_UPTIME_PCT);
  const uptimeScore = uptimeRatio * 70;

  // 2) bandwidth (30 คะแนน)
  const bwNorm = clamp01((bw - BW_MIN_GOOD) / (BW_MAX_CAP - BW_MIN_GOOD));
  const bwScore = bwNorm * 30;

  return Math.round(uptimeScore + bwScore);
}

/* ============================================================
   C) Trust Score CONFIG + ฟังก์ชันคำนวณ
   ============================================================ */

export const TRUST_CONFIG = {
  WINDOW_DAYS: 30,            // ดู 30 วันย้อนหลัง
  SHORT_WINDOW_DAYS: 7,       // uptime 7 วันล่าสุด
  UPTIME_TARGET: 95,          // uptime เฉลี่ย 7 วัน = 95% ถือว่าเต็ม
  STREAK_TARGET_DAYS: 30,     // streak 30 วัน = เต็ม
  ACCOUNT_AGE_TARGET_DAYS: 30 // อายุบัญชีครบ 30 วัน = เต็ม
};

export type TrustDailyRow = {
  dayUtc: Date;
  uptimePct: number | null;
  pointsEarned: number;
};

/**
 * คำนวณ streak (จำนวนวันที่ active ต่อเนื่อง)
 */
export function computeCurrentStreakFromHistory(history: TrustDailyRow[]): number {
  if (!history.length) return 0;

  const sorted = [...history].sort(
    (a, b) => b.dayUtc.getTime() - a.dayUtc.getTime()
  );

  let streak = 0;

  for (const row of sorted) {
    const active =
      (row.pointsEarned ?? 0) > 0 ||
      (row.uptimePct ?? 0) > 0;

    if (active) streak++;
    else break;
  }

  return streak;
}

/**
 * คำนวณ Trust Score (0–100)
 * uptime 60 + streak 30 + อายุบัญชี 10
 */
export function computeTrustScore(opts: {
  daily: TrustDailyRow[];
  userCreatedAt: Date;
  currentStreak: number;
}): number {
  const { daily, userCreatedAt, currentStreak } = opts;
  const {
    SHORT_WINDOW_DAYS,
    UPTIME_TARGET,
    STREAK_TARGET_DAYS,
    ACCOUNT_AGE_TARGET_DAYS,
  } = TRUST_CONFIG;

  if (!daily.length) return 0;

  const sorted = [...daily].sort(
    (a, b) => a.dayUtc.getTime() - b.dayUtc.getTime()
  );
  const last7 = sorted.slice(-SHORT_WINDOW_DAYS);

  const avgUptime7 =
    last7.length > 0
      ? last7.reduce((s, d) => s + (d.uptimePct ?? 0), 0) / last7.length
      : 0;

  // 1) uptime (60 คะแนน)
  const uptimeScore = clamp01(avgUptime7 / UPTIME_TARGET) * 60;

  // 2) streak (30 คะแนน)
  const streakScore = clamp01(currentStreak / STREAK_TARGET_DAYS) * 30;

  // 3) อายุบัญชี (10 คะแนน)
  const ageDays = Math.floor(
    (Date.now() - userCreatedAt.getTime()) / DAY_MS
  );
  const ageScore = clamp01(ageDays / ACCOUNT_AGE_TARGET_DAYS) * 10;

  return Math.round(uptimeScore + ageScore + streakScore);
}

/* ============================================================
   D) Summary สำหรับการ์ด Quality & Reliability
   ============================================================ */

export type QualityReliabilitySummary = {
  uptimeTodayPct: number; // ใช้แสดงแถบ Uptime Today (เช่น 25%)
  qualityFactor: number;  // 0–100
  trustScore: number;     // 0–100
  uptimeGoalPct: number;  // เอาไป render เป็น tooltip / label
};

/**
 * ดึง MetricsDaily + User มาคำนวณค่าในการ์ด
 * ใช้ userId ของผู้ใช้ปัจจุบัน
 */
export async function getQualityReliabilitySummary(
  userId: string
): Promise<QualityReliabilitySummary> {
  const todayUtc = startOfUtcDay(new Date());

  // 1) ดึง history 30 วันล่าสุดรวมวันนี้
  const since = new Date(
    todayUtc.getTime() - (TRUST_CONFIG.WINDOW_DAYS - 1) * DAY_MS
  );

  const dailyRowsRaw = await prisma.metricsDaily.findMany({
    where: {
      userId,
      dayUtc: {
        gte: since,
      },
    },
    orderBy: {
      dayUtc: "asc",
    },
  });

  // map เป็น TrustDailyRow
  const daily: TrustDailyRow[] = dailyRowsRaw.map((d) => ({
    dayUtc: d.dayUtc,
    uptimePct: d.uptimePct,
    pointsEarned: d.pointsEarned ?? 0,
  }));

  // วันนี้เอาไว้ใช้ uptimeToday + QF
  const todayRow =
    dailyRowsRaw.find(
      (d) => startOfUtcDay(d.dayUtc).getTime() === todayUtc.getTime()
    ) ?? null;

  const uptimeTodayPct = todayRow?.uptimePct ?? 0;
  const avgBandwidthToday = todayRow?.avgBandwidth ?? 0;

  const qualityFactor = computeQualityFactor(uptimeTodayPct, avgBandwidthToday);

  // 2) current streak
  const currentStreak = computeCurrentStreakFromHistory(daily);

  // 3) อายุบัญชี
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  const createdAt = user?.createdAt ?? new Date();

  const trustScore = computeTrustScore({
    daily,
    userCreatedAt: createdAt,
    currentStreak,
  });

  return {
    uptimeTodayPct,
    qualityFactor,
    trustScore,
    uptimeGoalPct: QF_CONFIG.GOAL_UPTIME_PCT,
  };
}
