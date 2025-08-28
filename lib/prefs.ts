// lib/prefs.ts
import type { Theme } from "./theme";
import type { Units } from "./format";

/** ค่าที่ผู้ใช้ตั้งค่าได้ใน Settings */
export type Preferences = {
  theme: Theme;        // "dark" | "oled" | "system"  (ระบบเรา default เป็น dark)
  tz: string;          // IANA TZ: "UTC", "America/New_York", ...
  currency: string;    // ISO code เช่น "USD"
  units: Units;        // "metric" | "binary"
  emailOptIn: boolean; // รับอีเมลข่าวสาร
};

/** ตัวเลือกสกุลเงิน (เรียงตามความนิยมคร่าว ๆ) */
export const CURRENCIES = [
  "USD", "EUR", "JPY", "GBP", "CNY", "KRW", "TWD",
  "AUD", "NZD", "CAD", "SGD", "HKD",
  "INR", "IDR", "VND", "MYR", "PHP",
  "CHF", "SEK", "NOK", "DKK", "PLN",
  "BRL", "MXN", "CLP", "COP", "THB",
  "AED", "SAR"
] as const;

/** ค่าเริ่มต้น */
export const DEFAULT_PREFS: Preferences = {
  theme: "dark",
  tz: "UTC",
  currency: "USD",
  units: "metric",
  emailOptIn: false
};

/** ลิสต์ที่อนุญาตไว้ (กันค่าหลุด ๆ) */
const THEMES: ReadonlyArray<Theme> = ["dark", "oled", "system"];
const UNITS: ReadonlyArray<Units> = ["metric", "binary"];
const CURR_SET = new Set(CURRENCIES as readonly string[]);

/** เคลียร์/เติมค่า default ให้ prefs เสมอ */
export function sanitizePrefs(input?: Partial<Preferences>): Preferences {
  const p = input ?? {};
  const theme: Theme = (THEMES.includes(p.theme as Theme) ? (p.theme as Theme) : DEFAULT_PREFS.theme);
  const tz = typeof p.tz === "string" && p.tz.trim() ? p.tz : DEFAULT_PREFS.tz;
  const currency = typeof p.currency === "string" && CURR_SET.has(p.currency) ? p.currency : DEFAULT_PREFS.currency;
  const units: Units = (UNITS.includes(p.units as Units) ? (p.units as Units) : DEFAULT_PREFS.units);
  const emailOptIn = !!p.emailOptIn;

  return { theme, tz, currency, units, emailOptIn };
}

/* ------------------------------------------------------------------ */
/*  Re-exports เพื่อความเข้ากันได้กับโค้ดเดิม (import type จาก prefs) */
/* ------------------------------------------------------------------ */
export type { Theme } from "./theme";
export type { Units } from "./format";
