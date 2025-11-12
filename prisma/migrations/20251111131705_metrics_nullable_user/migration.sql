/*
  Warnings:

  - A unique constraint covering the columns `[nonce]` on the table `PointEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PointEvent" ADD COLUMN     "nonce" TEXT;

-- CreateTable
CREATE TABLE "MetricsHourly" (
    "id" TEXT NOT NULL,
    "hourUtc" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "uptimePct" DOUBLE PRECISION,
    "avgBandwidth" DOUBLE PRECISION,
    "qfScore" DOUBLE PRECISION,
    "trustScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricsHourly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricsDaily" (
    "id" TEXT NOT NULL,
    "dayUtc" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "uptimePct" DOUBLE PRECISION,
    "avgBandwidth" DOUBLE PRECISION,
    "qfScore" DOUBLE PRECISION,
    "trustScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricsDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetricsHourly_hourUtc_idx" ON "MetricsHourly"("hourUtc");

-- CreateIndex
CREATE INDEX "MetricsHourly_userId_idx" ON "MetricsHourly"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricsHourly_hourUtc_userId_key" ON "MetricsHourly"("hourUtc", "userId");

-- CreateIndex
CREATE INDEX "MetricsDaily_dayUtc_idx" ON "MetricsDaily"("dayUtc");

-- CreateIndex
CREATE INDEX "MetricsDaily_userId_idx" ON "MetricsDaily"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricsDaily_dayUtc_userId_key" ON "MetricsDaily"("dayUtc", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PointEvent_nonce_key" ON "PointEvent"("nonce");

-- CreateIndex
CREATE INDEX "PointEvent_createdAt_idx" ON "PointEvent"("createdAt");

-- CreateIndex
CREATE INDEX "PointEvent_type_createdAt_idx" ON "PointEvent"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "MetricsHourly" ADD CONSTRAINT "MetricsHourly_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricsDaily" ADD CONSTRAINT "MetricsDaily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
