import type { RewardRule } from "./rules";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function linear01(v: number, start: number, end: number) {
  if (end <= start) return v >= end ? 1 : 0;
  return clamp((v - start) / (end - start), 0, 1);
}

export type RewardInputs = {
  uptimePct: number | null;     // from MetricsHourly
  downloadMbps: number | null;  // from MetricsHourly.avgBandwidth
  riskScore: number;            // from Node.riskScore (or aggregated)
};

export type RewardResult = {
  eligible: boolean;
  points: number;
  breakdown: {
    base: number;
    uptimeMult: number;
    bwMult: number;
    riskMult: number;
  };
  reason?: string;
};

export function computeHourlyReward(rule: RewardRule, input: RewardInputs): RewardResult {
  const uptime = input.uptimePct ?? 0;
  const bw = input.downloadMbps ?? 0;
  const risk = input.riskScore ?? 0;

  if (risk >= rule.freezeRisk) {
    return {
      eligible: false,
      points: 0,
      breakdown: { base: rule.basePointsPerHour, uptimeMult: 0, bwMult: 0, riskMult: 0 },
      reason: "risk_frozen",
    };
  }

  if (uptime < rule.minUptimePctToEarn) {
    return {
      eligible: false,
      points: 0,
      breakdown: { base: rule.basePointsPerHour, uptimeMult: 0, bwMult: 0, riskMult: 1 },
      reason: "uptime_too_low",
    };
  }

  if (bw < rule.minDownloadMbpsToEarn) {
    return {
      eligible: false,
      points: 0,
      breakdown: { base: rule.basePointsPerHour, uptimeMult: 1, bwMult: 0, riskMult: 1 },
      reason: "bandwidth_too_low",
    };
  }

  const uptimeMult = linear01(uptime, rule.uptimeLinearStart, rule.uptimeLinearEnd);
  const bwMult = linear01(bw, rule.bwLinearStart, rule.bwLinearEnd);

  let riskMult = 1;
  for (const r of rule.riskMultipliers) {
    if (risk >= r.min && risk <= r.max) {
      riskMult = r.mult;
      break;
    }
  }

  const raw = rule.basePointsPerHour * uptimeMult * bwMult * riskMult;
  const points = Math.floor(raw);

  return {
    eligible: points > 0,
    points,
    breakdown: {
      base: rule.basePointsPerHour,
      uptimeMult,
      bwMult,
      riskMult,
    },
  };
}
