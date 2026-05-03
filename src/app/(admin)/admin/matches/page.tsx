import { prisma } from "@/lib/prisma"
import Link from "next/link"
import MatchImportExportButton from "@/components/admin/MatchImportExportButton"
import MatchInlineRow from "@/components/admin/MatchInlineRow"

async function fetchSuggestions(): Promise<string[]> {
  const [matches, trips] = await Promise.all([
    prisma.match.findMany({ select: { attendees: true } }),
    prisma.trip.findMany({ select: { participants: true } }),
  ])
  const names = new Set<string>()
  for (const m of matches) {
    try { for (const n of JSON.parse(m.attendees) as string[]) if (n.trim()) names.add(n.trim()) } catch { /* skip */ }
  }
  for (const t of trips) {
    try { for (const n of JSON.parse(t.participants) as string[]) if (n.trim()) names.add(n.trim()) } catch { /* skip */ }
  }
  return [...names].sort((a, b) => a.localeCompare(b, "cs"))
}

export default async function AdminMatchesPage() {
  const [matchRows, suggestions] = await Promise.all([
    prisma.match.findMany({
      orderBy: { date: "desc" },
      include: { photos: { orderBy: { order: "asc" } } },
    }),
    fetchSuggestions(),
  ])
  const matches = matchRows

  const serialized = matches.map((m, idx) => ({
    id: m.id,
    date: m.date.toISOString(),
    competition: m.competition,
    opponent: m.opponent,
    homeAway: m.homeAway,
    venue: m.venue,
    scoreSpurs: m.scoreSpurs,
    scoreOpponent: m.scoreOpponent,
    attendees: m.attendees,
    videoUrl: m.videoUrl,
    notes: m.notes,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    photos: m.photos.map((p) => ({
      id: p.id,
      matchId: p.matchId,
      url: p.url,
      caption: p.caption,
      order: p.order,
      createdAt: p.createdAt.toISOString(),
    })),
    _index: matches.length - idx,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">Zápasy Spurs</h1>
          <p className="text-[#8e8e93] text-sm mt-0.5">{matches.length} zápasů celkem</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MatchImportExportButton />
          <Link
            href="/admin/matches/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nový zápas
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
        {serialized.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[#8e8e93] text-sm">Zatím žádné zápasy</p>
            <Link href="/admin/matches/new" className="mt-3 inline-block text-[#007aff] text-sm hover:underline">
              Přidat první zápas
            </Link>
          </div>
        ) : (
          <div>
            {serialized.map((m) => (
              <MatchInlineRow key={m.id} match={m} index={m._index} suggestions={suggestions} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
