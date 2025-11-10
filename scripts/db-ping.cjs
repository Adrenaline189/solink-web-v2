// Simple connectivity check without taking advisory locks.
import { Client } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[db-ping] DATABASE_URL is not set; skipping.");
    return;
  }
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const { rows } = await client.query("SELECT 1 AS ok");
    console.log("[db-ping] OK →", rows[0]);
  } catch (e) {
    console.error("[db-ping] Failed:", e.message);
    // Don't exit non-zero during build; only log.
  } finally {
    await client.end();
  }
}
main();
