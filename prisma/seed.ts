import bcrypt from "bcryptjs"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import path from "path"

const url =
  process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "dev.db")}`
const authToken = process.env.TURSO_AUTH_TOKEN
const adapter = new PrismaLibSql(authToken ? { url, authToken } : { url })
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: "admin" } })
  if (!existing) {
    const hashed = await bcrypt.hash("admin", 12)
    await prisma.user.create({
      data: { username: "admin", password: hashed, name: "Admin", role: "admin", email: "admin@kubicik.cz" },
    })
    console.log("Admin user created (admin/admin) – email: admin@kubicik.cz")
  } else {
    if (!existing.email) {
      await prisma.user.update({ where: { id: existing.id }, data: { email: "admin@kubicik.cz" } })
      console.log("Admin email backfilled to admin@kubicik.cz")
    } else {
      console.log("Admin user already exists")
    }
  }

  const familyUser = await prisma.user.findUnique({ where: { username: "rodina" } })
  if (!familyUser) {
    const hashed = await bcrypt.hash("rodina", 12)
    await prisma.user.create({
      data: { username: "rodina", password: hashed, name: "Rodina", role: "family" },
    })
    console.log("Family user created (rodina/rodina)")
  } else {
    console.log("Family user already exists")
  }

  await backfillPersons()
}

/**
 * One-time backfill of the unified person registry (číselník) from the legacy
 * JSON name arrays in Trip.participants / Match.attendees. Idempotent: only runs
 * when the Person table is empty, so it fires once on the first build after the
 * person_registry migration and is skipped forever after.
 */
async function backfillPersons() {
  const personCount = await prisma.person.count()
  if (personCount > 0) {
    console.log("Person registry already populated – skipping backfill")
    return
  }

  const parse = (s: string): string[] => {
    try { const a = JSON.parse(s); return Array.isArray(a) ? a : [] } catch { return [] }
  }
  const norm = (names: string[]): string[] => {
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

  const idByName = new Map<string, string>()
  const personId = async (name: string): Promise<string> => {
    const cached = idByName.get(name)
    if (cached) return cached
    const p = await prisma.person.upsert({ where: { name }, update: {}, create: { name } })
    idByName.set(name, p.id)
    return p.id
  }

  const [trips, matches] = await Promise.all([
    prisma.trip.findMany({ select: { id: true, participants: true } }),
    prisma.match.findMany({ select: { id: true, attendees: true } }),
  ])

  let links = 0
  for (const t of trips) {
    const names = norm(parse(t.participants))
    for (let i = 0; i < names.length; i++) {
      await prisma.tripParticipant.create({ data: { tripId: t.id, personId: await personId(names[i]), order: i } })
      links++
    }
  }
  for (const m of matches) {
    const names = norm(parse(m.attendees))
    for (let i = 0; i < names.length; i++) {
      await prisma.matchAttendee.create({ data: { matchId: m.id, personId: await personId(names[i]), order: i } })
      links++
    }
  }

  console.log(`Person registry backfilled: ${idByName.size} persons, ${links} links`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
