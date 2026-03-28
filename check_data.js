const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Hk2yVNmoizC3@ep-dark-silence-a1lz7z49-pooler.ap-southeast-1.aws.neon.tech/solinkdb?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  
  const today = new Date().toISOString().slice(0, 10);
  console.log('Today:', today);
  
  // Today's events
  const todayRes = await client.query(`
    SELECT DATE_TRUNC('day', "occurredAt" AT TIME ZONE 'UTC') as day, SUM("amount") as total, COUNT(*) as cnt
    FROM "PointEvent"
    WHERE "occurredAt" >= CURRENT_DATE AT TIME ZONE 'UTC'
      AND "amount" > 0
    GROUP BY 1
    ORDER BY 1
  `);
  console.log('\nToday pointEvents:');
  todayRes.rows.forEach(r => console.log(' ', r.day, 'total:', r.total, 'cnt:', r.cnt));
  
  // Last 7 days
  const weekRes = await client.query(`
    SELECT DATE_TRUNC('day', "occurredAt" AT TIME ZONE 'UTC') as day, SUM("amount") as total, COUNT(*) as cnt
    FROM "PointEvent"
    WHERE "occurredAt" >= CURRENT_DATE AT TIME ZONE 'UTC' - INTERVAL '7 days'
      AND "amount" > 0
    GROUP BY 1
    ORDER BY 1
  `);
  console.log('\nLast 7 days pointEvents:');
  weekRes.rows.forEach(r => console.log(' ', r.day, 'total:', r.total, 'cnt:', r.cnt));

  // User-specific today
  const userRes = await client.query(`
    SELECT DATE_TRUNC('day', "occurredAt" AT TIME ZONE 'UTC') as day, SUM("amount") as total, COUNT(*) as cnt
    FROM "PointEvent"
    WHERE "occurredAt" >= CURRENT_DATE AT TIME ZONE 'UTC'
      AND "amount" > 0
      AND "userId" = '4'
    GROUP BY 1
    ORDER BY 1
  `);
  console.log('\nUser 4 today pointEvents:');
  userRes.rows.forEach(r => console.log(' ', r.day, 'total:', r.total, 'cnt:', r.cnt));
  
  await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
