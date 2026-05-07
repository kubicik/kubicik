import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const matches = await prisma.match.findMany({
    orderBy: { date: "asc" },
    include: { photos: { orderBy: { order: "asc" } } },
  })

  const exported = matches.map((m) => ({
    id: m.id,
    date: m.date.toISOString(),
    competition: m.competition,
    opponent: m.opponent,
    homeAway: m.homeAway,
    venue: m.venue,
    scoreSpurs: m.scoreSpurs,
    scoreOpponent: m.scoreOpponent,
    outcome: m.outcome,
    attendees: (() => { try { return JSON.parse(m.attendees) } catch { return [] } })(),
    videoUrl: m.videoUrl,
    notes: m.notes,
    seasonId: m.seasonId,
    photos: m.photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption, order: p.order })),
  }))

  return new NextResponse(JSON.stringify(exported, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="spurs-matches.json"`,
    },
  })
}
