import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET() {
  const seasons = await prisma.season.findMany({
    orderBy: { name: "desc" },
    include: { _count: { select: { matches: true } } },
  })
  return NextResponse.json(seasons.map(serialize))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Chybí název" }, { status: 400 })
  const season = await prisma.season.create({ data: { name: name.trim() } })
  return NextResponse.json(serialize({ ...season, _count: { matches: 0 } }), { status: 201 })
}

function serialize(s: { id: string; name: string; createdAt: Date; updatedAt: Date; _count: { matches: number } }) {
  return { id: s.id, name: s.name, matchCount: s._count.matches, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() }
}
