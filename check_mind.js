const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Hk2yVNmoizC3@ep-dark-silence-a1lz7z49-pooler.ap-southeast-1.aws.neon.tech/solinkdb?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  const userId = 'cmn8sj2290000ik04u5rkes7r';
  
  // Check pointEvents for this user - last 7 days
  const weekRes = await client.query(`
    SELECT DATE_TRUNC('day', "occurredAt" AT TIME ZONE 'UTC') as day, SUM("amount") as total, COUNT(*) as cnt
    FROM "PointEvent"
    WHERE "userId" = $1
      AND "occurredAt" >= CURRENT_DATE AT TIME ZONE 'UTC' - INTERVAL '7 days'
      AND "amount" > 0
    GROUP BY 1
    ORDER BY 1
  `, [userId]);
  console.log('Mind last 7 days:');
  weekRes.rows.forEach(r => console.log(' ', r.day, 'total:', r.total, 'cnt:', r.cnt));

  // Check recent events
  const recentRes = await client.query(`
    SELECT "occurredAt", "amount", "type"
    FROM "PointEvent"
    WHERE "userId" = $1
    ORDER BY "occurredAt" DESC
    LIMIT 5
  `, [userId]);
  console.log('\nMind recent events:');
  recentRes.rows.forEach(r => console.log(' ', r.occurredAt, 'amount:', r.amount, 'type:', r.type));

  await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
