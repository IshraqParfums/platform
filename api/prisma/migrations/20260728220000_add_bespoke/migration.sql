-- CreateTable
CREATE TABLE "bespoke_perfumes" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formulaJson" JSONB NOT NULL,
    "answersJson" JSONB NOT NULL,
    "moodText" TEXT NOT NULL,
    "whyJson" JSONB NOT NULL,
    "inspiredJson" JSONB,
    "engineVersion" TEXT NOT NULL,
    "clientKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bespoke_perfumes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bespoke_perfumes_customerId_createdAt_idx" ON "bespoke_perfumes"("customerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "bespoke_perfumes_customerId_clientKey_key" ON "bespoke_perfumes"("customerId", "clientKey");

-- AddForeignKey
ALTER TABLE "bespoke_perfumes" ADD CONSTRAINT "bespoke_perfumes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable cart_items
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_productVariantId_fkey";

ALTER TABLE "cart_items" ALTER COLUMN "productVariantId" DROP NOT NULL;

ALTER TABLE "cart_items" ADD COLUMN "bespokePerfumeId" TEXT;
ALTER TABLE "cart_items" ADD COLUMN "bespokeSizeMl" INTEGER;

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_bespokePerfumeId_fkey" FOREIGN KEY ("bespokePerfumeId") REFERENCES "bespoke_perfumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "cart_items_cartId_bespokePerfumeId_bespokeSizeMl_key" ON "cart_items"("cartId", "bespokePerfumeId", "bespokeSizeMl");

CREATE INDEX "cart_items_bespokePerfumeId_idx" ON "cart_items"("bespokePerfumeId");

-- AlterTable order_items
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_productVariantId_fkey";

ALTER TABLE "order_items" ALTER COLUMN "productVariantId" DROP NOT NULL;

ALTER TABLE "order_items" ADD COLUMN "bespokePerfumeId" TEXT;
ALTER TABLE "order_items" ADD COLUMN "formulaJson" JSONB;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_bespokePerfumeId_fkey" FOREIGN KEY ("bespokePerfumeId") REFERENCES "bespoke_perfumes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "order_items_bespokePerfumeId_idx" ON "order_items"("bespokePerfumeId");
