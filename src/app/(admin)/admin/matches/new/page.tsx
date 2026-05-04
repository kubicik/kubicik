import { prisma } from "@/lib/prisma"
import MatchForm from "@/components/admin/MatchForm"

export default async function NewMatchPage() {
  const [matchAttendees, tripParticipants, seasons] = await Promise.all([
    prisma.match.findMany({ select: { attendees: true } }),
    prisma.trip.findMany({ select: { participants: true } }),
    prisma.season.findMany({ orderBy: { name: "desc" } }),
  ])

  const names = new Set<string>()
  for (const m of matchAttendees) {
    try { for (const n of JSON.parse(m.attendees) as string[]) if (n.trim()) names.add(n.trim()) } catch { /* skip */ }
  }
  for (const t of tripParticipants) {
    try { for (const n of JSON.parse(t.participants) as string[]) if (n.trim()) names.add(n.trim()) } catch { /* skip */ }
  }
  const suggestions = [...names].sort((a, b) => a.localeCompare(b, "cs"))

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-8">Nový zápas</h1>
      <MatchForm suggestions={suggestions} seasons={seasons.map((s) => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() }))} />
    </div>
  )
}
