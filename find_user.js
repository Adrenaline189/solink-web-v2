const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Hk2yVNmoizC3@ep-dark-silence-a1lz7z49-pooler.ap-southeast-1.aws.neon.tech/solinkdb?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  // Find all users
  const users = await client.query('SELECT id, wallet FROM "User" LIMIT 10');
  console.log('Users:', JSON.stringify(users.rows, null, 2));
  // Find user by wallet pattern (Phantom wallet)
  const phantom = await client.query('SELECT id, wallet FROM "User" WHERE wallet LIKE \'%solana%\' OR wallet LIKE \'%Phantom%\' LIMIT 5');
  console.log('Phantom users:', JSON.stringify(phantom.rows, null, 2));
  // Find user with wallet starting with '5' (common Phantom format)
  const wallet5 = await client.query('SELECT id, wallet FROM "User" WHERE wallet LIKE \'5%\' LIMIT 5');
  console.log('Wallet starting with 5:', JSON.stringify(wallet5.rows, null, 2));
  await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
