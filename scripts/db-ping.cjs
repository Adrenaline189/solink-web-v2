/**
 * Simple DB connectivity check.
 * Use this manually if you want to verify DATABASE_URL outside of Vercel build.
 */
import('pg').then(async ({ Client }) => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[db-ping] Missing DATABASE_URL");
    process.exit(1);
  }
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    const t0 = Date.now();
    await client.connect();
    const res = await client.query("SELECT 1 AS ok");
    console.log(`[db-ping] ok=${res.rows[0]?.ok} in ${Date.now() - t0}ms`);
    process.exit(0);
  } catch (e) {
    console.error("[db-ping] error:", e?.message || e);
    process.exit(2);
  } finally {
    try { await client.end(); } catch {}
  }
});
