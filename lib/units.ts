// lib/units.ts
export type Units = "metric" | "binary";

/** ป้ายกำกับหน่วยตาม prefs.units */
export function bandwidthLabel(units: Units) {
  return units === "binary" ? "MiB/s" : "Mb/s";
}

/** แปลง Mbps → หน่วยปลายทาง (metric: คงเดิม, binary: เป็น MiB/s) */
export function convertMbps(mbps: number, units: Units) {
  if (!isFinite(mbps)) return 0;
  return units === "binary" ? (mbps * 1_000_000) / (8 * 1024 * 1024) : mbps;
}

/** ฟอร์แมตข้อความสำหรับแสดงผล */
export function formatBandwidth(mbps: number, units: Units, digits = 2) {
  const v = convertMbps(mbps, units);
  return `${v.toFixed(digits)} ${bandwidthLabel(units)}`;
}
