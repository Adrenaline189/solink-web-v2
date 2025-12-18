import { prisma } from "@/lib/prisma";

function floorToHourUTC(d: Date) {
  const x = new Date(d);
  x.setUTCMinutes(0, 0, 0);
  return x;
}

function floorToDayUTC(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function upsertGlobalHourly(params: {
  hourUtc: Date;
  pointsEarned: number;
  uptimePct: number | null;
  avgBandwidth: number | null;
}) {
  const existing = await prisma.metricsHourly.findFirst({
    where: { hourUtc: params.hourUtc, userId: null },
    select: { id: true },
  });

  const data = {
    pointsEarned: params.pointsEarned,
    uptimePct: params.uptimePct,
    avgBandwidth: params.avgBandwidth,
  };

  if (existing) {
    await prisma.metricsHourly.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.metricsHourly.create({
      data: {
        hourUtc: params.hourUtc,
        userId: null,
        ...data,
      },
    });
  }
}

async function upsertGlobalDaily(params: {
  dayUtc: Date;
  pointsEarned: number;
  uptimePct: number | null;
  avgBandwidth: number | null;
}) {
  const existing = await prisma.metricsDaily.findFirst({
    where: { dayUtc: params.dayUtc, userId: null },
    select: { id: true },
  });

  const data = {
    pointsEarned: params.pointsEarned,
    uptimePct: params.uptimePct,
    avgBandwidth: params.avgBandwidth,
  };

  if (existing) {
    await prisma.metricsDaily.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.metricsDaily.create({
      data: {
        dayUtc: params.dayUtc,
        userId: null,
        ...data,
      },
    });
  }
}

/**
 * Hourly rollup:
 * - pointsEarned: sum(PointEvent.amount) per user in hour
 * - uptimePct: (#minutes with any NodeHeartbeat) / 60 * 100
 * - avgBandwidth: avg(VerifierTest.downloadMbps) in hour
 */
export async function rollupHourUTC(input?: { hourUtc?: Date }) {
  const hourUtc = input?.hourUtc ? floorToHourUTC(input.hourUtc) : floorToHourUTC(new Date());
  const nextHour = new Date(hourUtc.getTime() + 60 * 60 * 1000);

  // 1) points per user
  const pointsRows = await prisma.pointEvent.groupBy({
    by: ["userId"],
    where: { occurredAt: { gte: hourUtc, lt: nextHour } },
    _sum: { amount: true },
  });

  const pointsByUser = new Map<string, number>();
  for (const r of pointsRows) pointsByUser.set(r.userId, r._sum.amount ?? 0);

  // 2) uptimePct per user from NodeHeartbeat (minute-level)
  // NodeHeartbeat.at ถูกบันทึกแบบปัดเป็นนาทีอยู่แล้ว → นับ distinct minute per user ได้เลย
  const hbRows = await prisma.nodeHeartbeat.findMany({
    where: { at: { gte: hourUtc, lt: nextHour } },
    select: { at: true, node: { select: { userId: true } } },
  });

  const minutesSetByUser = new Map<string, Set<number>>();
  for (const row of hbRows) {
    const uid = row.node.userId;
    const t = new Date(row.at).getTime(); // minute bucket already
    let set = minutesSetByUser.get(uid);
    if (!set) {
      set = new Set<number>();
      minutesSetByUser.set(uid, set);
    }
    set.add(t);
  }

  const uptimePctByUser = new Map<string, number>();
  for (const [uid, set] of minutesSetByUser.entries()) {
    const pct = clamp((set.size / 60) * 100, 0, 100);
    uptimePctByUser.set(uid, pct);
  }

  // 3) avgBandwidth per user from VerifierTest (downloadMbps)
  const testRows = await prisma.verifierTest.findMany({
    where: { startedAt: { gte: hourUtc, lt: nextHour } },
    select: { downloadMbps: true, node: { select: { userId: true } } },
  });

  const bwSumByUser = new Map<string, number>();
  const bwCountByUser = new Map<string, number>();
  for (const row of testRows) {
    const uid = row.node.userId;
    bwSumByUser.set(uid, (bwSumByUser.get(uid) ?? 0) + row.downloadMbps);
    bwCountByUser.set(uid, (bwCountByUser.get(uid) ?? 0) + 1);
  }

  const avgBwByUser = new Map<string, number>();
  for (const [uid, sum] of bwSumByUser.entries()) {
    const c = bwCountByUser.get(uid) ?? 0;
    if (c > 0) avgBwByUser.set(uid, sum / c);
  }

  // 4) รวม userIds (แม้ไม่มี points แต่มี hb/test ก็ต้องถูก rollup)
  const allUserIds = new Set<string>();
  for (const uid of pointsByUser.keys()) allUserIds.add(uid);
  for (const uid of uptimePctByUser.keys()) allUserIds.add(uid);
  for (const uid of avgBwByUser.keys()) allUserIds.add(uid);

  // per-user upsert
  for (const userId of allUserIds) {
    const pointsEarned = pointsByUser.get(userId) ?? 0;
    const uptimePct = uptimePctByUser.has(userId) ? uptimePctByUser.get(userId)! : null;
    const avgBandwidth = avgBwByUser.has(userId) ? avgBwByUser.get(userId)! : null;

    await prisma.metricsHourly.upsert({
      where: { hourUtc_userId_unique: { hourUtc, userId } },
      update: { pointsEarned, uptimePct, avgBandwidth },
      create: { hourUtc, userId, pointsEarned, uptimePct, avgBandwidth },
    });
  }

  // global aggregates
  const globalPoints = Array.from(pointsByUser.values()).reduce((a, b) => a + b, 0);

  const uptimeVals = Array.from(uptimePctByUser.values());
  const globalUptime = uptimeVals.length ? uptimeVals.reduce((a, b) => a + b, 0) / uptimeVals.length : null;

  const bwVals = Array.from(avgBwByUser.values());
  const globalBw = bwVals.length ? bwVals.reduce((a, b) => a + b, 0) / bwVals.length : null;

  await upsertGlobalHourly({
    hourUtc,
    pointsEarned: globalPoints,
    uptimePct: globalUptime,
    avgBandwidth: globalBw,
  });

  return {
    hourUtc: hourUtc.toISOString(),
    users: allUserIds.size,
    total: globalPoints,
    uptimePctAvg: globalUptime,
    avgBandwidthAvg: globalBw,
  };
}

/**
 * Daily rollup:
 * - pointsEarned: sum(PointEvent.amount) per user in day
 * - uptimePct: (#minutes with any NodeHeartbeat) / 1440 * 100
 * - avgBandwidth: avg(VerifierTest.downloadMbps) in day
 */
export async function rollupDayUTC(input?: { dayUtc?: Date }) {
  const dayUtc = input?.dayUtc ? floorToDayUTC(input.dayUtc) : floorToDayUTC(new Date());
  const nextDay = new Date(dayUtc.getTime() + 24 * 60 * 60 * 1000);

  // 1) points per user
  const pointsRows = await prisma.pointEvent.groupBy({
    by: ["userId"],
    where: { occurredAt: { gte: dayUtc, lt: nextDay } },
    _sum: { amount: true },
  });

  const pointsByUser = new Map<string, number>();
  for (const r of pointsRows) pointsByUser.set(r.userId, r._sum.amount ?? 0);

  // 2) uptimePct per user from NodeHeartbeat
  const hbRows = await prisma.nodeHeartbeat.findMany({
    where: { at: { gte: dayUtc, lt: nextDay } },
    select: { at: true, node: { select: { userId: true } } },
  });

  const minutesSetByUser = new Map<string, Set<number>>();
  for (const row of hbRows) {
    const uid = row.node.userId;
    const t = new Date(row.at).getTime();
    let set = minutesSetByUser.get(uid);
    if (!set) {
      set = new Set<number>();
      minutesSetByUser.set(uid, set);
    }
    set.add(t);
  }

  const uptimePctByUser = new Map<string, number>();
  for (const [uid, set] of minutesSetByUser.entries()) {
    const pct = clamp((set.size / 1440) * 100, 0, 100);
    uptimePctByUser.set(uid, pct);
  }

  // 3) avgBandwidth per user from VerifierTest
  const testRows = await prisma.verifierTest.findMany({
    where: { startedAt: { gte: dayUtc, lt: nextDay } },
    select: { downloadMbps: true, node: { select: { userId: true } } },
  });

  const bwSumByUser = new Map<string, number>();
  const bwCountByUser = new Map<string, number>();
  for (const row of testRows) {
    const uid = row.node.userId;
    bwSumByUser.set(uid, (bwSumByUser.get(uid) ?? 0) + row.downloadMbps);
    bwCountByUser.set(uid, (bwCountByUser.get(uid) ?? 0) + 1);
  }

  const avgBwByUser = new Map<string, number>();
  for (const [uid, sum] of bwSumByUser.entries()) {
    const c = bwCountByUser.get(uid) ?? 0;
    if (c > 0) avgBwByUser.set(uid, sum / c);
  }

  // 4) รวม userIds
  const allUserIds = new Set<string>();
  for (const uid of pointsByUser.keys()) allUserIds.add(uid);
  for (const uid of uptimePctByUser.keys()) allUserIds.add(uid);
  for (const uid of avgBwByUser.keys()) allUserIds.add(uid);

  // per-user upsert
  for (const userId of allUserIds) {
    const pointsEarned = pointsByUser.get(userId) ?? 0;
    const uptimePct = uptimePctByUser.has(userId) ? uptimePctByUser.get(userId)! : null;
    const avgBandwidth = avgBwByUser.has(userId) ? avgBwByUser.get(userId)! : null;

    await prisma.metricsDaily.upsert({
      where: { dayUtc_userId_unique: { dayUtc, userId } },
      update: { pointsEarned, uptimePct, avgBandwidth },
      create: { dayUtc, userId, pointsEarned, uptimePct, avgBandwidth },
    });
  }

  // global aggregates
  const globalPoints = Array.from(pointsByUser.values()).reduce((a, b) => a + b, 0);

  const uptimeVals = Array.from(uptimePctByUser.values());
  const globalUptime = uptimeVals.length ? uptimeVals.reduce((a, b) => a + b, 0) / uptimeVals.length : null;

  const bwVals = Array.from(avgBwByUser.values());
  const globalBw = bwVals.length ? bwVals.reduce((a, b) => a + b, 0) / bwVals.length : null;

  await upsertGlobalDaily({
    dayUtc,
    pointsEarned: globalPoints,
    uptimePct: globalUptime,
    avgBandwidth: globalBw,
  });

  return {
    dayUtc: dayUtc.toISOString(),
    users: allUserIds.size,
    total: globalPoints,
    uptimePctAvg: globalUptime,
    avgBandwidthAvg: globalBw,
  };
}
