const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Check metricsDaily for recent days
  const metrics = await p.metricsDaily.findMany({
    where: {
      dayUtc: { gte: new Date('2026-03-25'), lt: new Date('2026-03-31') }
    },
    orderBy: { dayUtc: 'desc' },
    limit: 10
  });
  console.log('metricsDaily:', JSON.stringify(metrics, null, 2));

  // Check rolledPoints aggregated from hourlyPoints
  const hourStart = new Date('2026-03-29T00:00:00Z');
  const hourEnd = new Date('2026-03-30T00:00:00Z');
  const rolled = await p.hourlyPoints.aggregate({
    where: { hour: { gte: hourStart, lt: hourEnd } },
    _sum: { points: true }
  });
  console.log('hourlyPoints Mar 29 sum:', rolled._sum.points);
}

main().then(() => { process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); }).finally(() => p.$disconnect());
