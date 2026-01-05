// lib/format.ts

// ไม่พึ่งพา prefs.ts อีกต่อไป เพื่อเลี่ยงปัญหา type export
export type Units = "metric" | "binary";

/**
 * แสดงค่าแบนด์วิดท์จาก Mbps เป็นสตริงอ่านง่าย เช่น "2.100 Mb/s" หรือ "2.100 Mib/s"
 * - decimals: จำนวนทศนิยม (default = 3)
 */
export function formatBandwidth(
  mbps?: number,
  units: Units = "metric",
  decimals: number = 3
) {
  if (!(typeof mbps === "number" && Number.isFinite(mbps))) return "—";

  const v = mbps;
  const label = units === "binary" ? "Mib/s" : "Mb/s";

  // กันค่าพัง: จำกัดช่วง 0..6 (กันใส่เลขแปลก ๆ)
  const d = Math.max(0, Math.min(6, Math.trunc(decimals)));

  try {
    const n = v.toLocaleString(undefined, {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
    return `${n} ${label}`;
  } catch {
    return `${v.toFixed(d)} ${label}`;
  }
}

/** ชื่อหน่วยแบนด์วิดท์ตามโหมดที่เลือก */
export function bandwidthLabel(units: Units) {
  return units === "binary" ? "Mib/s" : "Mb/s";
}
