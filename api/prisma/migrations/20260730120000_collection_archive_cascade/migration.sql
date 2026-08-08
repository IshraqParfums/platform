-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductArchiveReason" AS ENUM ('MANUAL', 'COLLECTION');

-- AlterTable
ALTER TABLE "collections" ADD COLUMN "status" "CollectionStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "products" ADD COLUMN "archiveReason" "ProductArchiveReason";

-- Existing archived products were taken down manually (no collection cascade yet).
UPDATE "products"
SET "archiveReason" = 'MANUAL'
WHERE "status" = 'ARCHIVED' AND "archiveReason" IS NULL;

-- CreateIndex
CREATE INDEX "collections_status_idx" ON "collections"("status");

-- Composite index for homepage ranked collections (status existed only after this migration).
CREATE INDEX "collections_status_homeRank_idx" ON "collections"("status", "homeRank");

-- CreateIndex
CREATE INDEX "products_collectionId_status_archiveReason_idx" ON "products"("collectionId", "status", "archiveReason");
