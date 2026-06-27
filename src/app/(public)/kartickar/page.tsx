import { prisma } from "@/lib/prisma"
import SportSectionsClient from "@/components/public/SportSectionsClient"

export const revalidate = 60

const SPORTS = [
  { value: "football",   label: "⚽ Fotbal" },
  { value: "hockey",     label: "🏒 Hokej" },
  { value: "basketball", label: "🏀 Basketbal" },
] as const

export default async function KartickarPage() {
  const series = await prisma.cardSeries.findMany({
    orderBy: [{ year: "desc" }, { name: "asc" }],
    include: {
      cards: { select: { price: true, variants: { select: { isOwned: true, updatedAt: true } } } },
      tags: true,
    },
  })

  const now = new Date()
  const bySport = SPORTS.map((sport) => ({
    ...sport,
    premium: series.filter((s) => s.sport === sport.value && s.tier === "premium"),
    regular:  series.filter((s) => s.sport === sport.value && s.tier !== "premium"),
  })).filter((g) => g.premium.length + g.regular.length > 0)

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#ff9f0a] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1d1d1f]">Kartičky</h1>
            <p className="text-[#8e8e93] mt-0.5">Přehled sbírky kartiček</p>
          </div>
        </div>
      </div>

      {series.length === 0 ? (
        <div className="text-center py-20 text-[#8e8e93]">Žádné série zatím nebyly přidány.</div>
      ) : (
        <SportSectionsClient bySport={bySport} now={now} />
      )}
    </div>
  )
}
