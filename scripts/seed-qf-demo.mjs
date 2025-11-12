import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

try {
  // หาแถว system ของชั่วโมงล่าสุดวันนี้
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const last = await prisma.metricsHourly.findFirst({
    where: { userId: 'system', hourUtc: { gte: todayUtc } },
    orderBy: { hourUtc: 'desc' },
  });

  if (!last) {
    console.log('No system hourly row today. Run rollup first or seed events.');
    process.exit(0);
  }

  // ตั้ง QF เดโม (0–100) เช่น 68
  const qf = 68;
  await prisma.metricsHourly.update({
    where: { id: last.id },
    data: { qfScore: qf },
  });

  console.log('✅ set qfScore on system hour', last.hourUtc.toISOString(), '→', qf);
} catch (e) {
  console.error('❌', e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
