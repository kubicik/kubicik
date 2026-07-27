import { prisma } from "@/lib/prisma"

/**
 * Unified person registry (číselník) helpers.
 *
 * `Person` + the join tables `TripParticipant` / `MatchAttendee` are the
 * authoritative source of truth for who took part in a trip / match.
 * The legacy `Trip.participants` / `Match.attendees` TEXT columns are kept as a
 * denormalised JSON cache (array of names, in order) so that every existing read
 * path — public ISR pages, admin lists, exports — keeps working unchanged.
 *
 * Any write that changes membership MUST keep the cache and the join rows in
 * sync. Always go through these helpers.
 *
 * Note: we avoid Prisma interactive transactions on purpose — the libSQL/Turso
 * adapter only reliably supports the batch (`$transaction([...])`) form, which
 * the rest of the codebase uses. The membership swap is applied as one batch;
 * everything else runs as sequential, idempotent-on-retry writes.
 */

/** Trim, drop empties, dedupe by exact trimmed value (matches the UI's case-sensitive behaviour). */
export function normalizeNames(names: unknown): string[] {
  if (!Array.isArray(names)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of names) {
    if (typeof raw !== "string") continue
    const n = raw.trim()
    if (!n || seen.has(n)) continue
    seen.add(n)
    out.push(n)
  }
  return out
}

/** Find-or-create a Person per name; returns name → personId. */
async function upsertPersons(names: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  for (const name of names) {
    const person = await prisma.person.upsert({ where: { name }, update: {}, create: { name } })
    map.set(name, person.id)
  }
  return map
}

/**
 * Replace a trip's participant links to exactly `names` (ordered) AND refresh the
 * `Trip.participants` JSON cache — atomically, in one batch — so the two never
 * drift. Returns the normalised JSON cache string. The row must already exist.
 */
export async function syncTripParticipants(tripId: string, names: unknown): Promise<string> {
  const clean = normalizeNames(names)
  const idByName = await upsertPersons(clean)
  const cache = JSON.stringify(clean)
  await prisma.$transaction([
    prisma.tripParticipant.deleteMany({ where: { tripId } }),
    ...clean.map((name, i) =>
      prisma.tripParticipant.create({ data: { tripId, personId: idByName.get(name)!, order: i } })
    ),
    prisma.trip.update({ where: { id: tripId }, data: { participants: cache } }),
  ])
  return cache
}

/**
 * Replace a match's attendee links to exactly `names` (ordered) AND refresh the
 * `Match.attendees` JSON cache — atomically, in one batch. Returns the normalised
 * JSON cache string. The row must already exist.
 */
export async function syncMatchAttendees(matchId: string, names: unknown): Promise<string> {
  const clean = normalizeNames(names)
  const idByName = await upsertPersons(clean)
  const cache = JSON.stringify(clean)
  await prisma.$transaction([
    prisma.matchAttendee.deleteMany({ where: { matchId } }),
    ...clean.map((name, i) =>
      prisma.matchAttendee.create({ data: { matchId, personId: idByName.get(name)!, order: i } })
    ),
    prisma.match.update({ where: { id: matchId }, data: { attendees: cache } }),
  ])
  return cache
}

/** Recompute one trip's JSON cache from its ordered join rows. */
async function rebuildTripCache(tripId: string): Promise<void> {
  const links = await prisma.tripParticipant.findMany({
    where: { tripId },
    orderBy: { order: "asc" },
    include: { person: true },
  })
  await prisma.trip.update({ where: { id: tripId }, data: { participants: JSON.stringify(links.map((l) => l.person.name)) } })
}

/** Recompute one match's JSON cache from its ordered join rows. */
async function rebuildMatchCache(matchId: string): Promise<void> {
  const links = await prisma.matchAttendee.findMany({
    where: { matchId },
    orderBy: { order: "asc" },
    include: { person: true },
  })
  await prisma.match.update({ where: { id: matchId }, data: { attendees: JSON.stringify(links.map((l) => l.person.name)) } })
}

/** Rebuild JSON caches for every trip/match a person appears in. */
async function rebuildCachesForPerson(personId: string): Promise<void> {
  const [trips, matches] = await Promise.all([
    prisma.tripParticipant.findMany({ where: { personId }, select: { tripId: true } }),
    prisma.matchAttendee.findMany({ where: { personId }, select: { matchId: true } }),
  ])
  for (const t of trips) await rebuildTripCache(t.tripId)
  for (const m of matches) await rebuildMatchCache(m.matchId)
}

/** Rename a person and refresh every cache that references them. Throws `PERSON_NAME_TAKEN` on collision. */
export async function renamePerson(personId: string, rawName: string): Promise<void> {
  const name = rawName.trim()
  if (!name) throw new Error("PERSON_NAME_EMPTY")
  const clash = await prisma.person.findUnique({ where: { name } })
  if (clash && clash.id !== personId) throw new Error("PERSON_NAME_TAKEN")
  await prisma.person.update({ where: { id: personId }, data: { name } })
  await rebuildCachesForPerson(personId)
}

/**
 * Merge one or more source persons into a target person: every trip/match link
 * on a source is re-pointed to the target (deduped, order preserved), the source
 * persons are deleted, and all affected caches are rebuilt.
 */
export async function mergePersons(sourceIds: string[], targetId: string): Promise<void> {
  const sources = [...new Set(sourceIds)].filter((id) => id && id !== targetId)
  if (sources.length === 0) return

  const target = await prisma.person.findUnique({ where: { id: targetId } })
  if (!target) throw new Error("PERSON_NOT_FOUND")

  for (const sourceId of sources) {
    // Trips: move each link to the target unless the target is already in that trip.
    const tripLinks = await prisma.tripParticipant.findMany({ where: { personId: sourceId } })
    for (const link of tripLinks) {
      const exists = await prisma.tripParticipant.findUnique({
        where: { tripId_personId: { tripId: link.tripId, personId: targetId } },
      })
      if (exists) {
        await prisma.tripParticipant.delete({ where: { tripId_personId: { tripId: link.tripId, personId: sourceId } } })
      } else {
        await prisma.tripParticipant.update({
          where: { tripId_personId: { tripId: link.tripId, personId: sourceId } },
          data: { personId: targetId },
        })
      }
    }

    // Matches: same logic.
    const matchLinks = await prisma.matchAttendee.findMany({ where: { personId: sourceId } })
    for (const link of matchLinks) {
      const exists = await prisma.matchAttendee.findUnique({
        where: { matchId_personId: { matchId: link.matchId, personId: targetId } },
      })
      if (exists) {
        await prisma.matchAttendee.delete({ where: { matchId_personId: { matchId: link.matchId, personId: sourceId } } })
      } else {
        await prisma.matchAttendee.update({
          where: { matchId_personId: { matchId: link.matchId, personId: sourceId } },
          data: { personId: targetId },
        })
      }
    }

    await prisma.person.delete({ where: { id: sourceId } })
  }

  await rebuildCachesForPerson(targetId)
}

/** Delete a person, removing them from every trip/match and rebuilding those caches. */
export async function deletePerson(personId: string): Promise<void> {
  const [trips, matches] = await Promise.all([
    prisma.tripParticipant.findMany({ where: { personId }, select: { tripId: true } }),
    prisma.matchAttendee.findMany({ where: { personId }, select: { matchId: true } }),
  ])
  await prisma.person.delete({ where: { id: personId } }) // cascades to join rows
  for (const t of trips) await rebuildTripCache(t.tripId)
  for (const m of matches) await rebuildMatchCache(m.matchId)
}
