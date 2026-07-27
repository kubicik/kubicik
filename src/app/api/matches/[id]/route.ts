import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { normalizeNames, syncMatchAttendees } from "@/lib/persons"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params
  const match = await prisma.match.findUnique({ where: { id } })
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(serialize(match))
}

export async function PUT(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const cleanAttendees = normalizeNames(body.attendees)
  const match = await prisma.match.update({
    where: { id },
    data: {
      date: new Date(body.date),
      competition: body.competition,
      opponent: body.opponent,
      homeAway: body.homeAway ?? "home",
      venue: body.venue ?? null,
      scoreSpurs: Number(body.scoreSpurs),
      scoreOpponent: Number(body.scoreOpponent),
      outcome: body.outcome ?? null,
      attendees: JSON.stringify(cleanAttendees),
      seasonId: body.seasonId ?? null,
      videoUrl: body.videoUrl ?? null,
      notes: body.notes ?? null,
    },
  })
  await syncMatchAttendees(match.id, cleanAttendees)
  return NextResponse.json(serialize(match))
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.match.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}

function serialize(m: {
  id: string; date: Date; competition: string; opponent: string
  homeAway: string; venue: string | null; scoreSpurs: number; scoreOpponent: number
  outcome: string | null; attendees: string; videoUrl: string | null; notes: string | null
  seasonId: string | null; createdAt: Date; updatedAt: Date
}) {
  return {
    ...m,
    date: m.date.toISOString(),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }
}
