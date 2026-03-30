const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Check user's metricsDaily
  const userMetrics = await p.metricsDaily.findMany({
    where: { userId: 'cmn8sj2290000ik04u5rkes7' },
    orderBy: { dayUtc: 'desc' },
    limit: 5
  });
  console.log('user metricsDaily:', JSON.stringify(userMetrics, null, 2));

  // Check system metricsDaily
  const sysMetrics = await p.metricsDaily.findMany({
    where: { userId: 'system' },
    orderBy: { dayUtc: 'desc' },
    limit: 5
  });
  console.log('system metricsDaily:', JSON.stringify(sysMetrics, null, 2));
}

main().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); }).finally(() => p.$disconnect());
