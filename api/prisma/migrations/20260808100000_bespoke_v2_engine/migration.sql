-- Purge legacy v1 brews (only hard delete of brews that ever runs).
DELETE FROM "cart_items" WHERE "bespokePerfumeId" IN (
  SELECT "id" FROM "bespoke_perfumes" WHERE "engineVersion" = '1'
);
DELETE FROM "bespoke_perfumes" WHERE "engineVersion" = '1';

-- Soft-delete + Restrict: cart lines must survive brew soft-delete.
ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_bespokePerfumeId_fkey";
ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_bespokePerfumeId_fkey"
  FOREIGN KEY ("bespokePerfumeId") REFERENCES "bespoke_perfumes"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Product scent profiles for catalogue_select.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "scentProfileJson" JSONB;

-- Rework bespoke_perfumes for v2.
ALTER TABLE "bespoke_perfumes" ADD COLUMN IF NOT EXISTS "dedication" TEXT;
ALTER TABLE "bespoke_perfumes" ADD COLUMN IF NOT EXISTS "stateJson" JSONB;
ALTER TABLE "bespoke_perfumes" ADD COLUMN IF NOT EXISTS "colorThemeJson" JSONB;
ALTER TABLE "bespoke_perfumes" ADD COLUMN IF NOT EXISTS "graphVersion" TEXT;
ALTER TABLE "bespoke_perfumes" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Backfill placeholders for any remaining rows (should be none after v1 purge).
UPDATE "bespoke_perfumes"
SET "stateJson" = '{}'::jsonb
WHERE "stateJson" IS NULL;
UPDATE "bespoke_perfumes"
SET "colorThemeJson" = '{"primary":null,"secondary":null,"accent":"#A9762F"}'::jsonb
WHERE "colorThemeJson" IS NULL;
UPDATE "bespoke_perfumes"
SET "graphVersion" = 'unknown'
WHERE "graphVersion" IS NULL;

ALTER TABLE "bespoke_perfumes" ALTER COLUMN "stateJson" SET NOT NULL;
ALTER TABLE "bespoke_perfumes" ALTER COLUMN "colorThemeJson" SET NOT NULL;
ALTER TABLE "bespoke_perfumes" ALTER COLUMN "graphVersion" SET NOT NULL;

ALTER TABLE "bespoke_perfumes" DROP COLUMN IF EXISTS "answersJson";
ALTER TABLE "bespoke_perfumes" DROP COLUMN IF EXISTS "moodText";
ALTER TABLE "bespoke_perfumes" DROP COLUMN IF EXISTS "whyJson";
ALTER TABLE "bespoke_perfumes" DROP COLUMN IF EXISTS "inspiredJson";

CREATE INDEX IF NOT EXISTS "bespoke_perfumes_deletedAt_idx" ON "bespoke_perfumes"("deletedAt");

CREATE TYPE "BespokeSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CLAIMED');

CREATE TABLE "bespoke_sessions" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "customerId" TEXT,
  "stateJson" JSONB NOT NULL,
  "historyJson" JSONB NOT NULL,
  "shortlistJson" JSONB,
  "resultJson" JSONB,
  "status" "BespokeSessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "bespokePerfumeId" TEXT,
  "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bespoke_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bespoke_sessions_tokenHash_key" ON "bespoke_sessions"("tokenHash");
CREATE INDEX "bespoke_sessions_customerId_idx" ON "bespoke_sessions"("customerId");
CREATE INDEX "bespoke_sessions_status_expiresAt_idx" ON "bespoke_sessions"("status", "expiresAt");
CREATE INDEX "bespoke_sessions_bespokePerfumeId_idx" ON "bespoke_sessions"("bespokePerfumeId");

ALTER TABLE "bespoke_sessions"
  ADD CONSTRAINT "bespoke_sessions_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bespoke_sessions"
  ADD CONSTRAINT "bespoke_sessions_bespokePerfumeId_fkey"
  FOREIGN KEY ("bespokePerfumeId") REFERENCES "bespoke_perfumes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "bespoke_quiz_events" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "nodeId" TEXT NOT NULL,
  "nodeText" TEXT NOT NULL,
  "optionIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "optionLabels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bespoke_quiz_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bespoke_quiz_events_sessionId_at_idx" ON "bespoke_quiz_events"("sessionId", "at");
CREATE INDEX "bespoke_quiz_events_at_idx" ON "bespoke_quiz_events"("at");

ALTER TABLE "bespoke_quiz_events"
  ADD CONSTRAINT "bespoke_quiz_events_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "bespoke_sessions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
