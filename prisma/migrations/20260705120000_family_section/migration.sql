CREATE TABLE "FamilyChild" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#007aff',
  "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "Activity" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "childId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "location" TEXT,
  "color" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Activity_childId_fkey" FOREIGN KEY ("childId") REFERENCES "FamilyChild" ("id") ON DELETE CASCADE
);

CREATE TABLE "FamilyEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "childId" TEXT,
  "title" TEXT NOT NULL,
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME NOT NULL,
  "color" TEXT,
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FamilyEvent_childId_fkey" FOREIGN KEY ("childId") REFERENCES "FamilyChild" ("id") ON DELETE SET NULL
);
