/*
  Warnings:

  - You are about to drop the column `ip` on the `MetricsDaily` table. All the data in the column will be lost.
  - You are about to drop the column `ip` on the `MetricsHourly` table. All the data in the column will be lost.
  - You are about to drop the `ReferralCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SharingState` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "PointEvent_createdAt_idx";

-- DropIndex
DROP INDEX "PointEvent_nonce_key";

-- DropIndex
DROP INDEX "PointEvent_type_createdAt_idx";

-- DropIndex
DROP INDEX "PointEvent_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "MetricsDaily" DROP COLUMN "ip";

-- AlterTable
ALTER TABLE "MetricsHourly" DROP COLUMN "ip";

-- AlterTable
ALTER TABLE "PointEvent" ADD COLUMN     "nodeId" TEXT,
ADD COLUMN     "riskScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "signatureOk" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "occurredAt" SET DATA TYPE TIMESTAMP(3);

-- DropTable
DROP TABLE "ReferralCode";

-- DropTable
DROP TABLE "SharingState";

-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "fingerprint" TEXT,
    "region" TEXT,
    "asn" TEXT,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeHeartbeat" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "latencyMs" INTEGER,
    "signatureOk" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NodeHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifierTest" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "downloadMbps" DOUBLE PRECISION NOT NULL,
    "uploadMbps" DOUBLE PRECISION NOT NULL,
    "latencyMs" DOUBLE PRECISION NOT NULL,
    "jitterMs" DOUBLE PRECISION,
    "packetLoss" DOUBLE PRECISION,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifierTest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Node_publicKey_key" ON "Node"("publicKey");

-- CreateIndex
CREATE INDEX "Node_userId_idx" ON "Node"("userId");

-- CreateIndex
CREATE INDEX "NodeHeartbeat_nodeId_idx" ON "NodeHeartbeat"("nodeId");

-- CreateIndex
CREATE INDEX "NodeHeartbeat_at_idx" ON "NodeHeartbeat"("at");

-- CreateIndex
CREATE UNIQUE INDEX "NodeHeartbeat_nodeId_at_key" ON "NodeHeartbeat"("nodeId", "at");

-- CreateIndex
CREATE INDEX "VerifierTest_nodeId_idx" ON "VerifierTest"("nodeId");

-- CreateIndex
CREATE INDEX "VerifierTest_nodeId_startedAt_idx" ON "VerifierTest"("nodeId", "startedAt");

-- CreateIndex
CREATE INDEX "PointEvent_userId_occurredAt_idx" ON "PointEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "PointEvent_nodeId_occurredAt_idx" ON "PointEvent"("nodeId", "occurredAt");

-- CreateIndex
CREATE INDEX "PointEvent_type_occurredAt_idx" ON "PointEvent"("type", "occurredAt");

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointEvent" ADD CONSTRAINT "PointEvent_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeHeartbeat" ADD CONSTRAINT "NodeHeartbeat_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifierTest" ADD CONSTRAINT "VerifierTest_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
