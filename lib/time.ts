// lib/time.ts
export type DateRange = "today" | "7d" | "30d";

/** อ่านโซนเวลาจาก data-tz ของ <html> (ที่ layout ตั้งไว้ตอนโหลด) */
export function getTZ(): string {
  if (typeof document !== "undefined") {
    const tz = document.documentElement.getAttribute("data-tz");
    return tz || "UTC";
  }
  return "UTC";
}

/** ฟอร์แมตวันที่ตามโซนเวลา */
export function formatInTZ(
  date: string | number | Date,
  tz: string,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const fmt = new Intl.DateTimeFormat("en-US", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
    ...opts,
  });
  return fmt.format(d);
}
