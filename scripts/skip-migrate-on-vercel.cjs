// scripts/skip-migrate-on-vercel.cjs
// Purpose: Avoid running Prisma migrations during Vercel builds.
// Vercel sets VERCEL=1 in the build environment. We only generate Prisma Client.
// In CI (non-Vercel), we do run `prisma migrate deploy` instead.

import { execSync } from "node:child_process";

const onVercel = process.env.VERCEL === "1";
const force = process.env.FORCE_MIGRATE_ON_VERCEL === "1";

try {
  if (onVercel && !force) {
    console.log("[skip-migrate-on-vercel] Vercel build detected → skip migrations.");
    execSync("npm run prisma:generate", { stdio: "inherit" });
  } else {
    console.log("[skip-migrate-on-vercel] Not on Vercel (or forced) → run migrations.");
    execSync("npm run prisma:migrate", { stdio: "inherit" });
    execSync("npm run prisma:generate", { stdio: "inherit" });
  }
} catch (e) {
  console.error("[skip-migrate-on-vercel] Failed:", e?.message || e);
  process.exit(1);
}
