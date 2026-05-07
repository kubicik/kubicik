import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const raw = await request.json()
  const preview: boolean = !Array.isArray(raw) && raw.preview === true
  const items: Record<string, unknown>[] = Array.isArray(raw) ? raw : (raw.matches ?? [])

  if (items.length === 0) {
    return NextResponse.json({ error: "Prázdný seznam zápasů" }, { status: 400 })
  }

  const existing = await prisma.match.findMany({ select: { id: true, opponent: true, date: true } })
  const existingMap = new Map(existing.map((m) => [m.id, m]))

  const toUpdate = items.filter((m) => m.id && existingMap.has(m.id as string))
  const toCreate = items.filter((m) => !m.id || !existingMap.has(m.id as string))
  const jsonIds = new Set(items.filter((m) => m.id).map((m) => m.id as string))
  const toDelete = existing.filter((m) => !jsonIds.has(m.id))

  if (preview) {
    return NextResponse.json({
      toCreate: toCreate.length,
      toUpdate: toUpdate.length,
      toDelete: toDelete.length,
      deletedMatchLabels: toDelete.map((m) =>
        `${m.opponent} (${new Date(m.date).toLocaleDateString("cs-CZ")})`
      ),
    })
  }

  // Validate required fields
  for (const m of items) {
    if (!m.date || !m.competition || !m.opponent || m.scoreSpurs == null || m.scoreOpponent == null) {
      return NextResponse.json(
        { error: `Zápas postrádá povinná pole (date, competition, opponent, scoreSpurs, scoreOpponent): ${JSON.stringify(m).slice(0, 80)}` },
        { status: 400 }
      )
    }
  }

  const updated: string[] = []
  const created: string[] = []

  for (const m of toUpdate) {
    await prisma.match.update({
      where: { id: m.id as string },
      data: {
        date: new Date(m.date as string),
        competition: m.competition as string,
        opponent: m.opponent as string,
        homeAway: (m.homeAway as string) ?? "home",
        venue: (m.venue as string | null) ?? null,
        scoreSpurs: Number(m.scoreSpurs),
        scoreOpponent: Number(m.scoreOpponent),
        outcome: (m.outcome as string | null) ?? null,
        attendees: JSON.stringify(Array.isArray(m.attendees) ? m.attendees : []),
        videoUrl: (m.videoUrl as string | null) ?? null,
        notes: (m.notes as string | null) ?? null,
        seasonId: (m.seasonId as string | null) ?? null,
      },
    })
    updated.push(m.id as string)
  }

  for (const m of toCreate) {
    const match = await prisma.match.create({
      data: {
        date: new Date(m.date as string),
        competition: m.competition as string,
        opponent: m.opponent as string,
        homeAway: (m.homeAway as string) ?? "home",
        venue: (m.venue as string | null) ?? null,
        scoreSpurs: Number(m.scoreSpurs),
        scoreOpponent: Number(m.scoreOpponent),
        outcome: (m.outcome as string | null) ?? null,
        attendees: JSON.stringify(Array.isArray(m.attendees) ? m.attendees : []),
        videoUrl: (m.videoUrl as string | null) ?? null,
        notes: (m.notes as string | null) ?? null,
        seasonId: (m.seasonId as string | null) ?? null,
      },
    })
    created.push(match.id)
  }

  for (const m of toDelete) {
    await prisma.match.delete({ where: { id: m.id } })
  }

  return NextResponse.json({
    updated: updated.length,
    created: created.length,
    deleted: toDelete.length,
  })
}
