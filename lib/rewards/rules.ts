export type RewardRule = {
  version: string;

  // base reward per hour if eligible
  basePointsPerHour: number;

  // uptime gating
  minUptimePctToEarn: number; // below this => 0
  uptimeLinearStart: number;  // start scaling multiplier from here
  uptimeLinearEnd: number;    // at/above => full uptime multiplier

  // bandwidth gating + bonus
  minDownloadMbpsToEarn: number; // below => 0
  bwLinearStart: number;         // start scaling bw multiplier from here
  bwLinearEnd: number;           // at/above => full bw multiplier

  // caps
  maxPointsPerNodePerDay: number;
  maxPointsPerUserPerDay: number;

  // risk penalties
  // if riskScore >= freezeRisk => no rewards for that hour
  freezeRisk: number;

  // risk multiplier table (piecewise)
  // e.g. risk 0..2 => 1.0, 3..5 => 0.7, 6..9 => 0.4, >=10 => 0
  riskMultipliers: Array<{ min: number; max: number; mult: number }>;
};

export const DEFAULT_REWARD_RULE: RewardRule = {
  version: "reward_v1",

  basePointsPerHour: 60, // คุณปรับได้ (เช่น 60 แต้ม/ชั่วโมงเมื่อ uptime+bw ผ่านเต็ม)

  minUptimePctToEarn: 10,     // ต้องมีอย่างน้อย 10% (6 นาที/ชม) ถึงเริ่มได้แต้ม
  uptimeLinearStart: 10,
  uptimeLinearEnd: 100,

  minDownloadMbpsToEarn: 5,   // ต้องมี download >= 5 Mbps ถึงเริ่มได้แต้ม
  bwLinearStart: 5,
  bwLinearEnd: 100,

  maxPointsPerNodePerDay: 2000,
  maxPointsPerUserPerDay: 5000,

  freezeRisk: 10,
  riskMultipliers: [
    { min: 0, max: 2, mult: 1.0 },
    { min: 3, max: 5, mult: 0.7 },
    { min: 6, max: 9, mult: 0.4 },
    { min: 10, max: 999999, mult: 0.0 },
  ],
};
