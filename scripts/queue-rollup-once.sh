#!/usr/bin/env bash
set -euo pipefail
export $(grep -v '^#' .env.production.local | xargs) || true
npx tsx scripts/queue-rollup-hour.ts
