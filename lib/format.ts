// lib/format.ts

// ไม่พึ่งพา prefs.ts อีกต่อไป เพื่อเลี่ยงปัญหา type export
export type Units = "metric" | "binary";

/** แสดงค่าแบนด์วิดท์จาก Mbps เป็นสตริงอ่านง่าย เช่น "2.1 Mb/s" หรือ "2.1 Mib/s" */
export function formatBandwidth(mbps?: number, units: Units = "metric") {
  if (!(typeof mbps === "number" && isFinite(mbps))) return "—";
  const v = mbps;
  const label = units === "binary" ? "Mib/s" : "Mb/s";
  try {
    const n = v.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return `${n} ${label}`;
  } catch {
    return `${v} ${label}`;
  }
}

/** ชื่อหน่วยแบนด์วิดท์ตามโหมดที่เลือก */
export function bandwidthLabel(units: Units) {
  return units === "binary" ? "Mib/s" : "Mb/s";
}
