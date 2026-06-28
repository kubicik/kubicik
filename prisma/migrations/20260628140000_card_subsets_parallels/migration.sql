-- Add collectBase to CardSeries
ALTER TABLE "CardSeries" ADD COLUMN "collectBase" INTEGER NOT NULL DEFAULT 1;

-- Create CardSubset table
CREATE TABLE "CardSubset" (
  "id"        TEXT     NOT NULL PRIMARY KEY,
  "seriesId"  TEXT     NOT NULL,
  "name"      TEXT     NOT NULL DEFAULT 'Base',
  "isSpecial" INTEGER  NOT NULL DEFAULT 0,
  "order"     INTEGER  NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("seriesId") REFERENCES "CardSeries"("id") ON DELETE CASCADE
);

-- Seed one Base subset per existing series
INSERT INTO "CardSubset" ("id", "seriesId", "name", "isSpecial", "order")
SELECT 'bs_' || "id", "id", 'Base', 0, 0 FROM "CardSeries";

-- Create CardParallel table
CREATE TABLE "CardParallel" (
  "id"          TEXT    NOT NULL PRIMARY KEY,
  "subsetId"    TEXT    NOT NULL,
  "name"        TEXT    NOT NULL,
  "limitNumber" INTEGER,
  "isCollected" INTEGER NOT NULL DEFAULT 1,
  "order"       INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("subsetId") REFERENCES "CardSubset"("id") ON DELETE CASCADE
);

-- Add subsetId to Card (nullable during migration)
ALTER TABLE "Card" ADD COLUMN "subsetId" TEXT;

-- Populate subsetId from seriesId
UPDATE "Card" SET "subsetId" = 'bs_' || "seriesId";

-- Seed CardParallel from distinct (seriesId, variantName, limitNumber)
INSERT OR IGNORE INTO "CardParallel" ("id", "subsetId", "name", "limitNumber", "isCollected", "order")
SELECT DISTINCT
  'par_bs_' || c."seriesId" || '_' || cv."variantName",
  'bs_' || c."seriesId",
  cv."variantName",
  cv."limitNumber",
  1,
  0
FROM "CardVariant" cv
JOIN "Card" c ON cv."cardId" = c."id"
WHERE c."seriesId" IS NOT NULL;

-- Add parallelId to CardVariant (nullable during migration)
ALTER TABLE "CardVariant" ADD COLUMN "parallelId" TEXT;

-- Populate parallelId
UPDATE "CardVariant" SET "parallelId" = (
  SELECT 'par_bs_' || c."seriesId" || '_' || "CardVariant"."variantName"
  FROM "Card" c WHERE c."id" = "CardVariant"."cardId" LIMIT 1
);

-- Drop old indexes before dropping columns
DROP INDEX IF EXISTS "Card_seriesId_number_key";
DROP INDEX IF EXISTS "CardVariant_cardId_variantName_key";

-- Drop old columns
ALTER TABLE "Card" DROP COLUMN "seriesId";
ALTER TABLE "CardVariant" DROP COLUMN "variantName";
ALTER TABLE "CardVariant" DROP COLUMN "limitNumber";

-- New unique indexes
CREATE UNIQUE INDEX "Card_subsetId_number_key" ON "Card"("subsetId", "number");
CREATE UNIQUE INDEX "CardVariant_cardId_parallelId_key" ON "CardVariant"("cardId", "parallelId");
