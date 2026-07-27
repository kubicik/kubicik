import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { renamePerson, deletePerson } from "@/lib/persons"

type Ctx = { params: Promise<{ id: string }> }

// Person detail: identity + every trip / match they appear in.
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params
  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      trips: { include: { trip: { select: { id: true, slug: true, title: true, startDate: true, published: true } } } },
      matches: { include: { match: { select: { id: true, opponent: true, competition: true, date: true, scoreSpurs: true, scoreOpponent: true, homeAway: true } } } },
    },
  })
  if (!person) return NextResponse.json({ error: "Nenalezeno" }, { status: 404 })

  return NextResponse.json({
    id: person.id,
    name: person.name,
    trips: person.trips
      .map((l) => ({
        id: l.trip.id,
        slug: l.trip.slug,
        title: l.trip.title,
        startDate: l.trip.startDate.toISOString(),
        published: l.trip.published,
      }))
      .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    matches: person.matches
      .map((l) => ({
        id: l.match.id,
        opponent: l.match.opponent,
        competition: l.match.competition,
        date: l.match.date.toISOString(),
        scoreSpurs: l.match.scoreSpurs,
        scoreOpponent: l.match.scoreOpponent,
        homeAway: l.match.homeAway,
      }))
      .sort((a, b) => b.date.localeCompare(a.date)),
  })
}

// Rename a person (propagates to every trip/match cache).
export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Chybí jméno" }, { status: 400 })
  try {
    await renamePerson(id, name)
  } catch (e) {
    if (e instanceof Error && e.message === "PERSON_NAME_TAKEN") {
      return NextResponse.json({ error: "Osoba s tímto jménem už existuje – použij sloučení." }, { status: 409 })
    }
    throw e
  }
  return NextResponse.json({ ok: true })
}

// Delete a person (removes them from every trip/match).
export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await deletePerson(id)
  return NextResponse.json({ ok: true })
}
