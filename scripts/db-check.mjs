import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

try {
  const rows = await prisma.$queryRawUnsafe('SELECT 1 AS ok');
  console.log('✅ DB OK:', rows);
} catch (e) {
  console.error('❌ DB ERROR:', e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
