# AutoFarm Scheduler v1.1

## Run modes
- **DRY-RUN**: `DRY_RUN=1` — no network calls (no login, no earn, no 401/429). Safe to test flow.
- **LIVE**: default — login (if no token) + earn loops with backoff.

## Quick start
```bash
# Install deps if needed
pnpm i  # or npm i / yarn

# Dry test (no network)
DRY_RUN=1 npx tsx scripts/autofarm-scheduler.ts

# Live using config wallets
npx tsx scripts/autofarm-scheduler.ts

# Live, single wallet
WALLETS=demo_wallet_test2 npx tsx scripts/autofarm-scheduler.ts

# Live, override params
WALLETS=demo_wallet_test1,demo_wallet_test2 BURSTS=20 CONCURRENCY=2 AMOUNT=50 CAP=2000 npx tsx scripts/autofarm-scheduler.ts
