const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Hk2yVNmoizC3@ep-dark-silence-a1lz7z49-pooler.ap-southeast-1.aws.neon.tech/solinkdb?sslmode=require',
  ssl: { rejectUnauthorized: false },
});
async function main() {
  await client.connect();
  const res = await client.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'MetricsDaily\' ORDER BY ordinal_position');
  console.log('MetricsDaily columns:', res.rows.map(r => r.column_name).join(', '));
  const res2 = await client.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'MetricsHourly\' ORDER BY ordinal_position');
  console.log('MetricsHourly columns:', res2.rows.map(r => r.column_name).join(', '));
  await client.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
