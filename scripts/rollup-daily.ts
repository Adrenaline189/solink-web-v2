// scripts/rollup-daily.ts
import { prisma } from "@/lib/prisma";

function truncateToDayUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

async function rollupDaily(targetDay: Date) {
  const dayUtc = truncateToDayUtc(targetDay);
  const nextDayUtc = new Date(dayUtc);
  nextDayUtc.setUTCDate(nextDayUtc.getUTCDate() + 1);

  console.log(`[rollup-daily] Rolling up ${dayUtc.toISOString()} ...`);

  const hourlyRows = await prisma.metricsHourly.findMany({
    where: {
      hourUtc: {
        gte: dayUtc,
        lt: nextDayUtc,
      },
    },
  });

  console.log(`[rollup-daily] fetched ${hourlyRows.length} rows`);

  // รวมแต้มต่อ user (string | null)
  const byUser = new Map<string | null, number>();

  for (const r of hourlyRows) {
    const key: string | null = r.userId ?? null;
    const cur = byUser.get(key) ?? 0;
    byUser.set(key, cur + (r.pointsEarned ?? 0));
  }

  console.log(`[rollup-daily] aggregated ${byUser.size} buckets`);

  // อัปเดต MetricsDaily
  for (const [userId, total] of byUser.entries()) {
    if (userId === null) {
      // 📌 GLOBAL (userId = null) → ห้าม upsert composite
      const existing = await prisma.metricsDaily.findFirst({
        where: { dayUtc, userId: null },
      });

      if (existing) {
        await prisma.metricsDaily.update({
          where: { id: existing.id },
          data: { pointsEarned: total },
        });
      } else {
        await prisma.metricsDaily.create({
          data: {
            dayUtc,
            userId: null,
            pointsEarned: total,
          },
        });
      }

    } else {
      // 📌 USER ROW → ใช้ upsert ได้ตามปกติ
      await prisma.metricsDaily.upsert({
        where: {
          dayUtc_userId_unique: {
            dayUtc,
            userId, // 👈 now always string (TS OK)
          },
        },
        update: {
          pointsEarned: total,
        },
        create: {
          dayUtc,
          userId,
          pointsEarned: total,
        },
      });
    }
  }

  console.log(`[rollup-daily] DONE ${dayUtc.toISOString()}`);
}

async function main() {
  const arg = process.argv[2];
  let targetDay: Date;

  if (arg) {
    const d = new Date(arg);
    if (isNaN(d.getTime())) throw new Error(`Invalid date: ${arg}`);
    targetDay = d;
  } else {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1); // default → yesterday UTC
    targetDay = d;
  }

  await rollupDaily(targetDay);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
