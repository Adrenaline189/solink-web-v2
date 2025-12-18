-- Restore SharingState table (was dropped by previous migration)

CREATE TABLE "SharingState" (
  "id" TEXT NOT NULL,
  "wallet" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SharingState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SharingState_wallet_key" ON "SharingState"("wallet");
CREATE INDEX "SharingState_wallet_idx" ON "SharingState"("wallet");
