// Purpose: prevent running Prisma migrations during Vercel builds.
// Vercel sets VERCEL=1 by default in the build environment.

import { execSync } from "node:child_process";

const isVercel = process.env.VERCEL === "1";

// Optional override if you ever want to force-run (not recommended on Vercel)
const forceRun = process.env.FORCE_MIGRATE_ON_VERCEL === "1";

if (isVercel && !forceRun) {
  // 🔒 Do NOT run migrations on Vercel. Only generate Prisma Client.
  // This avoids P1002 "advisory lock timeout" against Neon serverless pooler.
  console.log("[skip-migrate-on-vercel] Vercel build detected → skipping migrations.");
  execSync("npm run prisma:generate", { stdio: "inherit" });
} else {
  // Local/CI path (or forced): safe to run if DB is reachable.
  console.log("[skip-migrate-on-vercel] Not on Vercel (or forced) → running migrations.");
  execSync("npm run prisma:migrate", { stdio: "inherit" });
  execSync("npm run prisma:generate", { stdio: "inherit" });
}
