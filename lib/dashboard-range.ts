// lib/dashboard-range.ts
import type { DashboardRange } from "@/types/dashboard";

/**
 * คืนค่า start / end แบบ UTC สำหรับช่วงที่ต้องการ
 * today  = วันนี้ตั้งแต่ 00:00 UTC จนถึงตอนนี้
 * 7d     = 7 วันล่าสุด (รวมวันนี้) แบบ day-based
 * 30d    = 30 วันล่าสุด (รวมวันนี้)
 */
export function getRangeBounds(range: DashboardRange): {
  range: DashboardRange;
  startUtc: Date;
  endUtc: Date;
} {
  const now = new Date();
  // ใช้ startOfDay (UTC)
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let startUtc = todayUtc;
  let endUtc = new Date(todayUtc.getTime());
  endUtc.setUTCDate(endUtc.getUTCDate() + 1); // พรุ่งนี้ 00:00 (exclusive)

  if (range === "7d") {
    startUtc = new Date(todayUtc.getTime());
    startUtc.setUTCDate(startUtc.getUTCDate() - 6); // วันนี้ + ย้อนหลัง 6 วัน = 7 วัน
  } else if (range === "30d") {
    startUtc = new Date(todayUtc.getTime());
    startUtc.setUTCDate(startUtc.getUTCDate() - 29); // 30 วัน
  }

  return { range, startUtc, endUtc };
}

/** format วันที่เป็น label สำหรับกราฟ เช่น "11/25" */
export function formatDayLabel(d: Date): string {
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}
