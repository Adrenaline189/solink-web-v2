-- ===============================
-- Fix PointEvent for legacy rows
-- ===============================

-- 1) เพิ่ม column แบบ nullable ก่อน
ALTER TABLE "PointEvent"
ADD COLUMN "dedupeKey" TEXT,
ADD COLUMN "occurredAt" TIMESTAMPTZ,
ADD COLUMN "ruleVersion" TEXT,
ADD COLUMN "source" TEXT;

-- 2) backfill ข้อมูลเก่า
UPDATE "PointEvent"
SET
  "dedupeKey" = COALESCE("nonce", 'legacy-' || id),
  "occurredAt" = COALESCE("createdAt", now()),
  "ruleVersion" = 'legacy',
  "source" = 'legacy';

-- 3) บังคับ NOT NULL หลังจากข้อมูลครบแล้ว
ALTER TABLE "PointEvent"
ALTER COLUMN "dedupeKey" SET NOT NULL,
ALTER COLUMN "occurredAt" SET NOT NULL,
ALTER COLUMN "ruleVersion" SET NOT NULL,
ALTER COLUMN "source" SET NOT NULL;

-- 4) unique index กัน replay
CREATE UNIQUE INDEX IF NOT EXISTS "PointEvent_dedupeKey_key"
ON "PointEvent" ("dedupeKey");
