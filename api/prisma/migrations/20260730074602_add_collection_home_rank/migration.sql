-- AlterTable
ALTER TABLE "collections" ADD COLUMN     "homeRank" INTEGER;

-- CreateIndex
CREATE INDEX "collections_status_homeRank_idx" ON "collections"("status", "homeRank");
