import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const now = new Date();
const hourStart = new Date(Date.UTC(
  now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
  now.getUTCHours(), 0, 0, 0
));

const users = ['u1', 'u2', 'u3', 'u4', 'u5'];
const events = users.map((u) => ({
  type: 'extension_farm',
  userId: u,
  amount: Math.floor(Math.random() * 100) + 50, // 50–150 points
  createdAt: new Date(),
  meta: { auto: true },
}));

try {
  const res = await prisma.pointEvent.createMany({ data: events });
  console.log('🌱 farm simulator created', res.count, 'events');
} catch (e) {
  console.error('❌ farm simulator error', e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
