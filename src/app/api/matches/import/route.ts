import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const items = Array.isArray(body) ? body : [body]

  if (items.length === 0) {
    return NextResponse.json({ error: "Prázdný seznam zápasů" }, { status: 400 })
  }

  const created: string[] = []
  for (const m of items) {
    if (!m.date || !m.competition || !m.opponent || m.scoreSpurs == null || m.scoreOpponent == null) {
      return NextResponse.json(
        { error: `Zápas postrádá povinná pole (date, competition, opponent, scoreSpurs, scoreOpponent): ${JSON.stringify(m).slice(0, 80)}` },
        { status: 400 }
      )
    }
    const match = await prisma.match.create({
      data: {
        date: new Date(m.date),
        competition: m.competition,
        opponent: m.opponent,
        homeAway: m.homeAway ?? "home",
        venue: m.venue ?? null,
        scoreSpurs: Number(m.scoreSpurs),
        scoreOpponent: Number(m.scoreOpponent),
        attendees: JSON.stringify(Array.isArray(m.attendees) ? m.attendees : []),
        videoUrl: m.videoUrl ?? null,
        notes: m.notes ?? null,
      },
    })
    created.push(match.id)
  }

  return NextResponse.json({ imported: created.length, ids: created }, { status: 201 })
}
