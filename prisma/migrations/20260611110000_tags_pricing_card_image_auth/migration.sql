-- CardTag číselník
CREATE TABLE "CardTag" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#007aff',
  "symbol" TEXT NOT NULL DEFAULT '🏷',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Implicit M2M: CardSeries <-> CardTag
CREATE TABLE "_CardSeriesToCardTag" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_CardSeriesToCardTag_A_fkey" FOREIGN KEY ("A") REFERENCES "CardSeries" ("id") ON DELETE CASCADE,
  CONSTRAINT "_CardSeriesToCardTag_B_fkey" FOREIGN KEY ("B") REFERENCES "CardTag" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "_CardSeriesToCardTag_AB_unique" ON "_CardSeriesToCardTag"("A", "B");
CREATE INDEX "_CardSeriesToCardTag_B_index" ON "_CardSeriesToCardTag"("B");

-- Pricing on CardSeries
ALTER TABLE "CardSeries" ADD COLUMN "pricePerCard" REAL;
ALTER TABLE "CardSeries" ADD COLUMN "isPricingEnabled" INTEGER NOT NULL DEFAULT 0;

-- Image per Card
ALTER TABLE "Card" ADD COLUMN "imageUrl" TEXT;

-- Email on User
ALTER TABLE "User" ADD COLUMN "email" TEXT;

-- Password reset tokens
CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "token" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
