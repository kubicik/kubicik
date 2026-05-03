import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const [matches, trips] = await Promise.all([
    prisma.match.findMany({ select: { attendees: true } }),
    prisma.trip.findMany({ select: { participants: true } }),
  ])

  const names = new Set<string>()

  for (const m of matches) {
    try {
      for (const n of JSON.parse(m.attendees) as string[]) {
        if (n.trim()) names.add(n.trim())
      }
    } catch { /* skip */ }
  }
  for (const t of trips) {
    try {
      for (const n of JSON.parse(t.participants) as string[]) {
        if (n.trim()) names.add(n.trim())
      }
    } catch { /* skip */ }
  }

  return NextResponse.json([...names].sort((a, b) => a.localeCompare(b, "cs")))
}
