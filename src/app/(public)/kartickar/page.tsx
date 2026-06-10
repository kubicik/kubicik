import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const revalidate = 60

export default async function KartickarPage() {
  const series = await prisma.cardSeries.findMany({
    orderBy: [{ year: "desc" }, { name: "asc" }],
    include: {
      cards: {
        include: { variants: { select: { isOwned: true } } },
      },
    },
  })

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
            <p className="text-[#8e8e93] mt-0.5">Přehled sbírky fotbalových kartiček</p>
          </div>
        </div>
      </div>

      {series.length === 0 ? (
        <div className="text-center py-20 text-[#8e8e93]">Žádné série zatím nebyly přidány.</div>
      ) : (
        <div className="space-y-4">
          {series.map((s) => {
            const ownedCount = s.cards.flatMap((c) => c.variants).filter((v) => v.isOwned).length
            const pct = s.totalCardsCount > 0 ? Math.min(100, Math.round((ownedCount / s.totalCardsCount) * 100)) : 0

            return (
              <Link
                key={s.id}
                href={`/kartickar/${s.slug}`}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-shadow group"
              >
                {s.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.imageUrl}
                    alt={s.name}
                    className="w-14 h-20 object-cover rounded-xl flex-shrink-0 border border-[#e5e5ea]"
                  />
                ) : (
                  <div className="w-14 h-20 rounded-xl bg-[#f2f2f7] flex items-center justify-center flex-shrink-0 border border-[#e5e5ea]">
                    <svg className="w-6 h-6 text-[#c7c7cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <h2 className="font-semibold text-[#1d1d1f] group-hover:text-[#007aff] transition-colors truncate">
                      {s.name}
                    </h2>
                    <span className="text-xs text-[#8e8e93] flex-shrink-0">{s.year}</span>
                  </div>
                  <p className="text-xs text-[#8e8e93] mb-2">
                    {ownedCount} / {s.totalCardsCount > 0 ? s.totalCardsCount : "?"} variant
                  </p>
                  <div className="h-2 bg-[#e5e5ea] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct === 100 ? "#34c759" : pct > 50 ? "#007aff" : "#ff9f0a",
                      }}
                    />
                  </div>
                  <p className="text-xs font-medium text-[#3c3c43] mt-1">{pct}% nasbíráno</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
