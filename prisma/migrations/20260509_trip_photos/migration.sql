CREATE TABLE "TripPhoto" (
  "id"        TEXT    NOT NULL PRIMARY KEY,
  "tripId"    TEXT    NOT NULL,
  "stopId"    TEXT,
  "isDrone"   INTEGER NOT NULL DEFAULT 0,
  "url"       TEXT    NOT NULL,
  "caption"   TEXT,
  "order"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TripPhoto_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TripPhoto_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "Stop" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
