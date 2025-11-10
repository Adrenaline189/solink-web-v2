/**
 * Skip Prisma migrations during Vercel build.
 *
 * Why:
 * - Running `prisma migrate deploy` on Vercel often fails due to advisory-lock
 *   timeouts (P1002) when using pooled providers like Neon/pgBouncer.
 * - Best practice: run migrations in CI (GitHub Actions) or manually before deploy.
 *
 * Behavior:
 * - If Vercel environment is detected (process.env.VERCEL), we print guidance and exit 0.
 * - For non-Vercel CI, we keep skipping by policy (you can adjust if needed).
 * - For local builds, we also skip to avoid surprises.
 */
const isVercel = !!process.env.VERCEL;
const isCI = !!process.env.CI;

if (isVercel) {
  console.log("[skip-migrate-on-vercel] Detected Vercel environment.");
  console.log("[skip-migrate-on-vercel] Skipping `prisma migrate deploy` during build.");
  console.log("[skip-migrate-on-vercel] Tip: run migrations in CI or manually before deployment.");
  process.exit(0);
}

if (isCI) {
  console.log("[skip-migrate-on-vercel] CI detected (non-Vercel).");
  console.log("[skip-migrate-on-vercel] Not running migrations here by policy.");
  process.exit(0);
}

console.log("[skip-migrate-on-vercel] Local build detected. Migrations are not executed automatically.");
process.exit(0);
