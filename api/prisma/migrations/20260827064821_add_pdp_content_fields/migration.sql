-- CreateEnum
CREATE TYPE "ScentIntensity" AS ENUM ('LIGHT', 'MODERATE', 'STRONG');

-- CreateEnum
CREATE TYPE "ScentSillage" AS ENUM ('INTIMATE', 'MODERATE', 'STRONG');

-- CreateEnum
CREATE TYPE "ScentLongevity" AS ENUM ('SHORT', 'MODERATE', 'LONG', 'VERY_LONG');

-- CreateEnum
CREATE TYPE "ProductGender" AS ENUM ('UNISEX', 'FEMININE', 'MASCULINE');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "application" TEXT,
ADD COLUMN     "bottleDescription" TEXT,
ADD COLUMN     "care" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "characterTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "claims" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "concentration" TEXT,
ADD COLUMN     "faqJson" JSONB,
ADD COLUMN     "formatLabel" TEXT,
ADD COLUMN     "gender" "ProductGender",
ADD COLUMN     "howToUse" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "intensity" "ScentIntensity",
ADD COLUMN     "longevity" "ScentLongevity",
ADD COLUMN     "meaning" TEXT,
ADD COLUMN     "meaningStoryJson" JSONB,
ADD COLUMN     "notesPyramidJson" JSONB,
ADD COLUMN     "occasion" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pronunciation" TEXT,
ADD COLUMN     "scentFamily" TEXT,
ADD COLUMN     "season" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sillage" "ScentSillage",
ADD COLUMN     "taglinePrimary" TEXT,
ADD COLUMN     "taglineTranslation" TEXT;
