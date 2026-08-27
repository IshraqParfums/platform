-- Table is @@map("products"), not the Prisma model name.
ALTER TABLE "products" DROP COLUMN "detailedDescription",
DROP COLUMN "howToUse",
DROP COLUMN "care";
