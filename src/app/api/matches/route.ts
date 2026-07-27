import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { normalizeNames, syncMatchAttendees } from "@/lib/persons"

export async function GET() {
  const matches = await prisma.match.findMany({
    orderBy: { date: "desc" },
  })
  return NextResponse.json(matches.map(serialize))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const cleanAttendees = normalizeNames(body.attendees)
  const match = await prisma.match.create({
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
  return NextResponse.json(serialize(match), { status: 201 })
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
