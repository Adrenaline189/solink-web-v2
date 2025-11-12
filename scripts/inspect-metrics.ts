// scripts/inspect-metrics.ts
/* Inspect hourly & daily rollups (UTC)
 *
 * Usage:
 *   # ดูของวันนี้ (UTC)
 *   npx tsx scripts/inspect-metrics.ts
 *
 *   # ระบุวันที่ (UTC) รูปแบบ YYYY-MM-DD
 *   DATE=2025-11-11 npx tsx scripts/inspect-metrics.ts
 *
 *   # หรือผ่าน argv
 *   npx tsx scripts/inspect-metrics.ts --date=2025-11-11
 *
 *   # จำกัดจำนวน top users ของวันนั้น (ไม่รวม system)
 *   npx tsx scripts/inspect-metrics.ts --date=2025-11-11 --top=10
 */

import { prisma } from "@/server/db";

function getArg(name: string): string | undefined {
  const fromEnv = process.env[name.toUpperCase()];
  if (fromEnv) return fromEnv;
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : undefined;
}

function dayStartUtc(dateStr?: string): Date {
  const d = dateStr ? new Date(dateStr + "T00:00:00Z") : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dayEndUtc(dayStart: Date): Date {
  return new Date(dayStart.getTime() + 86_400_000);
}

async function main() {
  const dateArg = getArg("date"); // YYYY-MM-DD
  const topArg = getArg("top");
  const topN = Math.max(1, Number(topArg ?? "5") || 5);

  const dayStart = dayStartUtc(dateArg);
  const dayEnd = dayEndUtc(dayStart);

  const dayIso = dayStart.toISOString().slice(0, 10);
  console.log(`\n📅 Inspecting (UTC day): ${dayIso}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? "✓ set" : "✗ missing"}`);
  console.log("");

  // ---- Daily total (system/global row) ----
  const daily = await prisma.metricsDaily.findUnique({
    where: {
      dayUtc_userId_unique: { dayUtc: dayStart, userId: "system" },
    },
  });

  console.log("=== Daily total (system) ===");
  if (daily) {
    console.table([
      {
        dayUtc: daily.dayUtc.toISOString(),
        userId: daily.userId,
        pointsEarned: daily.pointsEarned,
        qfScore: daily.qfScore ?? null,
      },
    ]);
  } else {
    console.log("(no daily total row yet)");
  }
  console.log("");

  // ---- Hourly breakdown (including system row) ----
  const hourly = await prisma.metricsHourly.findMany({
    where: { hourUtc: { gte: dayStart, lt: dayEnd } },
    orderBy: { hourUtc: "asc" },
  });

  console.log("=== Hourly breakdown ===");
  if (hourly.length) {
    console.table(
      hourly.map((h) => ({
        hourUtc: h.hourUtc.toISOString(),
        userId: h.userId,
        pointsEarned: h.pointsEarned,
        qfScore: h.qfScore ?? null,
      }))
    );
  } else {
    console.log("(no hourly rows)");
  }
  console.log("");

  // ---- Top users of the day (exclude system) ----
  const topUsers = await prisma.metricsHourly.groupBy({
    by: ["userId"],
    where: {
      hourUtc: { gte: dayStart, lt: dayEnd },
      userId: { not: "system" },
    },
    _sum: { pointsEarned: true },
    orderBy: { _sum: { pointsEarned: "desc" } },
    take: topN,
  });

  console.log(`=== Top ${topN} users of the day (exclude system) ===`);
  if (topUsers.length) {
    console.table(
      topUsers.map((u) => ({
        userId: u.userId,
        pointsEarned: u._sum.pointsEarned ?? 0,
      }))
    );
  } else {
    console.log("(no user rows today)");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("inspect error:", e);
  prisma.$disconnect().finally(() => process.exit(1));
});
