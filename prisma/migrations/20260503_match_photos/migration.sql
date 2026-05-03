CREATE TABLE "MatchPhoto" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "matchId"   TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "caption"   TEXT,
  "order"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatchPhoto_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
