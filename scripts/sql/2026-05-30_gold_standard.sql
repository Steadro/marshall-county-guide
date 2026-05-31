-- Gold-standard pipeline: additive migration for schema.prisma changes.
-- SAFE: only adds a type, columns (all nullable or defaulted), and one index.
-- No existing data is altered. Existing rows get qualityTier = 'UNREVIEWED'.
--
-- PREFERRED way to apply (from your machine, which can reach Neon):
--     npx prisma migrate dev --name gold_standard
-- That generates an equivalent migration from the updated schema.prisma.
--
-- This file is a hand-written fallback you can paste into the Neon SQL editor
-- if you'd rather apply it directly. It is idempotent where Postgres allows.

DO $$ BEGIN
  CREATE TYPE "QualityTier" AS ENUM ('UNREVIEWED', 'STANDARD', 'GOLD');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "subcategory" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "qualityTier" "QualityTier" NOT NULL DEFAULT 'UNREVIEWED';
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "internalContext" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "reviewFlag" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "googlePlaceId" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "googleMapsUrl" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3);
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "activitySource" TEXT;

CREATE INDEX IF NOT EXISTS "Business_qualityTier_idx" ON "Business"("qualityTier");
