// lib/timezones.ts
export type TZ = { id: string; label: string };

/**
 * รายการ IANA TZ แบบย่อ (ใช้ id ตามมาตรฐานจริง ๆ)
 * label = id ตรง ๆ เพื่อเลี่ยงชื่อท้องถิ่น เช่น "Asia/Bangkok"
 * เพิ่ม/ลบได้ตามต้องการ
 */
export const TIMEZONES: TZ[] = [
  { id: "UTC", label: "UTC" },

  // Americas
  { id: "America/Los_Angeles", label: "America/Los_Angeles" },
  { id: "America/Denver", label: "America/Denver" },
  { id: "America/Chicago", label: "America/Chicago" },
  { id: "America/New_York", label: "America/New_York" },
  { id: "America/Sao_Paulo", label: "America/Sao_Paulo" },

  // Europe
  { id: "Europe/London", label: "Europe/London" },
  { id: "Europe/Berlin", label: "Europe/Berlin" },
  { id: "Europe/Paris", label: "Europe/Paris" },
  { id: "Europe/Madrid", label: "Europe/Madrid" },
  { id: "Europe/Moscow", label: "Europe/Moscow" },

  // Africa / Middle East
  { id: "Africa/Johannesburg", label: "Africa/Johannesburg" },
  { id: "Africa/Cairo", label: "Africa/Cairo" },
  { id: "Asia/Dubai", label: "Asia/Dubai" },
  { id: "Asia/Riyadh", label: "Asia/Riyadh" },

  // Asia-Pacific
  { id: "Asia/Kolkata", label: "Asia/Kolkata" },
  { id: "Asia/Jakarta", label: "Asia/Jakarta" },
  { id: "Asia/Singapore", label: "Asia/Singapore" },
  { id: "Asia/Hong_Kong", label: "Asia/Hong_Kong" },
  { id: "Asia/Tokyo", label: "Asia/Tokyo" },
  { id: "Asia/Seoul", label: "Asia/Seoul" },
  { id: "Australia/Sydney", label: "Australia/Sydney" },
  { id: "Pacific/Auckland", label: "Pacific/Auckland" }
];
