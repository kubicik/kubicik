-- Unified person registry (číselník účastníků výletů + spurs zápasů)

CREATE TABLE "Person" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Person_name_key" ON "Person"("name");

CREATE TABLE "TripParticipant" (
  "tripId"   TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "order"    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("tripId", "personId"),
  CONSTRAINT "TripParticipant_tripId_fkey"   FOREIGN KEY ("tripId")   REFERENCES "Trip" ("id")   ON DELETE CASCADE,
  CONSTRAINT "TripParticipant_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE
);

CREATE INDEX "TripParticipant_personId_idx" ON "TripParticipant"("personId");

CREATE TABLE "MatchAttendee" (
  "matchId"  TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "order"    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("matchId", "personId"),
  CONSTRAINT "MatchAttendee_matchId_fkey"  FOREIGN KEY ("matchId")  REFERENCES "Match" ("id")  ON DELETE CASCADE,
  CONSTRAINT "MatchAttendee_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE
);

CREATE INDEX "MatchAttendee_personId_idx" ON "MatchAttendee"("personId");
