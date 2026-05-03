import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import MatchForm from "@/components/admin/MatchForm"

export default async function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [match, matchAttendees, tripParticipants] = await Promise.all([
    prisma.match.findUnique({
      where: { id },
      include: { photos: { orderBy: { order: "asc" } } },
    }),
    prisma.match.findMany({ select: { attendees: true } }),
    prisma.trip.findMany({ select: { participants: true } }),
  ])
  if (!match) notFound()

  const names = new Set<string>()
  for (const m of matchAttendees) {
    try { for (const n of JSON.parse(m.attendees) as string[]) if (n.trim()) names.add(n.trim()) } catch { /* skip */ }
  }
  for (const t of tripParticipants) {
    try { for (const n of JSON.parse(t.participants) as string[]) if (n.trim()) names.add(n.trim()) } catch { /* skip */ }
  }
  const suggestions = [...names].sort((a, b) => a.localeCompare(b, "cs"))

  const serialized = {
    ...match,
    date: match.date.toISOString(),
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString(),
    photos: match.photos.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-8">Upravit zápas</h1>
      <MatchForm match={serialized} suggestions={suggestions} />
    </div>
  )
}
