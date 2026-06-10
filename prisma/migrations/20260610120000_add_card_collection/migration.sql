CREATE TABLE "CardSeries" (
  "id"              TEXT     NOT NULL PRIMARY KEY,
  "name"            TEXT     NOT NULL,
  "year"            INTEGER  NOT NULL,
  "displayMode"     TEXT     NOT NULL DEFAULT 'missing_only',
  "totalCardsCount" INTEGER  NOT NULL DEFAULT 0,
  "imageUrl"        TEXT,
  "slug"            TEXT     NOT NULL,
  "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       DATETIME NOT NULL
);

CREATE UNIQUE INDEX "CardSeries_slug_key" ON "CardSeries"("slug");

CREATE TABLE "Card" (
  "id"        TEXT     NOT NULL PRIMARY KEY,
  "seriesId"  TEXT     NOT NULL,
  "number"    TEXT     NOT NULL,
  "name"      TEXT     NOT NULL,
  "order"     INTEGER  NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Card_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "CardSeries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Card_seriesId_number_key" ON "Card"("seriesId", "number");

CREATE TABLE "CardVariant" (
  "id"          TEXT     NOT NULL PRIMARY KEY,
  "cardId"      TEXT     NOT NULL,
  "variantName" TEXT     NOT NULL,
  "limitNumber" INTEGER,
  "isOwned"     INTEGER  NOT NULL DEFAULT 0,
  "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   DATETIME NOT NULL,
  CONSTRAINT "CardVariant_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CardVariant_cardId_variantName_key" ON "CardVariant"("cardId", "variantName");
