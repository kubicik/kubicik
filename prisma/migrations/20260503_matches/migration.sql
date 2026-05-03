CREATE TABLE "Match" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "date"          DATETIME NOT NULL,
  "competition"   TEXT NOT NULL,
  "opponent"      TEXT NOT NULL,
  "homeAway"      TEXT NOT NULL DEFAULT 'home',
  "venue"         TEXT,
  "scoreSpurs"    INTEGER NOT NULL,
  "scoreOpponent" INTEGER NOT NULL,
  "attendees"     TEXT NOT NULL DEFAULT '[]',
  "videoUrl"      TEXT,
  "notes"         TEXT,
  "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
