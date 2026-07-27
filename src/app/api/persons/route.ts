import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// List the unified person registry (číselník) with occurrence counts.
export async function GET() {
  const persons = await prisma.person.findMany({
    include: { _count: { select: { trips: true, matches: true } } },
  })
  const list = persons
    .map((p) => ({
      id: p.id,
      name: p.name,
      tripCount: p._count.trips,
      matchCount: p._count.matches,
      total: p._count.trips + p._count.matches,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "cs"))
  return NextResponse.json(list)
}
