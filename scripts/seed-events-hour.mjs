import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const now = new Date();
const hourStart = new Date(Date.UTC(
  now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
  now.getUTCHours(), 0, 0, 0
));

// สร้างเหตุการณ์ในชั่วโมงนี้ให้ผู้ใช้หลายคน (ปรับจำนวนได้)
const events = [
  { userId: 'u1', amount: 300 },
  { userId: 'u2', amount: 250 },
  { userId: 'u3', amount: 200 },
  { userId: 'u4', amount: 150 },
  { userId: 'u5', amount: 100 },
].map((e, i) => ({
  type: 'extension_farm',
  amount: e.amount,
  userId: e.userId,
  createdAt: new Date(hourStart.getTime() + (i + 1) * 60_000), // กระจายในชั่วโมง
  meta: { seed: 'hourly-demo' },
}));

try {
  const res = await prisma.pointEvent.createMany({ data: events });
  console.log('✅ inserted events in hour', hourStart.toISOString(), 'count=', res.count);
} catch (e) {
  console.error('❌ seed error:', e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
