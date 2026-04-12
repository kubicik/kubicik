import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const revalidate = 60

export default async function ParticipantsPage() {
  const trips = await prisma.trip.findMany({
    where: { published: true },
    select: { participants: true },
  })

  // Build participant → trip count map
  const counts = new Map<string, number>()
  for (const trip of trips) {
    let names: string[] = []
    try { names = JSON.parse(trip.participants) as string[] } catch { /* skip */ }
    for (const name of names) {
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "cs"))

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold text-[#1d1d1f] tracking-tight mb-2">Účastníci</h1>
        <p className="text-[#6e6e73] text-lg">Kdo byl kde</p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-[#8e8e93]">Zatím žádní účastníci.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map(([name, count]) => (
            <Link
              key={name}
              href={`/participants/${encodeURIComponent(name)}`}
              className="flex items-center justify-between bg-white rounded-2xl border border-[#e5e5ea] px-5 py-4 hover:border-[#007aff] hover:shadow-[0_4px_16px_rgba(0,122,255,0.1)] transition-all group"
            >
              <span className="font-medium text-[#1d1d1f] group-hover:text-[#007aff] transition-colors">
                {name}
              </span>
              <span className="text-sm text-[#8e8e93]">
                {count} {count === 1 ? "výlet" : count < 5 ? "výlety" : "výletů"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
