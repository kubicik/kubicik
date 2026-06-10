import { prisma } from "@/lib/prisma"
import Link from "next/link"
import CardSeriesDeleteButton from "@/components/admin/CardSeriesDeleteButton"

export default async function AdminKartickarPage() {
  const series = await prisma.cardSeries.findMany({
    orderBy: [{ year: "desc" }, { name: "asc" }],
    include: {
      cards: {
        include: { variants: { select: { isOwned: true } } },
      },
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">Kartičky</h1>
          <p className="text-[#8e8e93] text-sm mt-0.5">{series.length} sérií</p>
        </div>
        <Link
          href="/admin/kartickar/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nová série
        </Link>
      </div>

      {series.length === 0 ? (
        <div className="text-center py-20 text-[#8e8e93] bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          Zatím žádné série.
        </div>
      ) : (
        <div className="space-y-3">
          {series.map((s) => {
            const ownedCount = s.cards.flatMap((c) => c.variants).filter((v) => v.isOwned).length
            const pct = s.totalCardsCount > 0 ? Math.min(100, Math.round((ownedCount / s.totalCardsCount) * 100)) : 0

            return (
              <div key={s.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
                {s.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.imageUrl}
                    alt={s.name}
                    className="w-12 h-16 object-cover rounded-lg flex-shrink-0 border border-[#e5e5ea]"
                  />
                ) : (
                  <div className="w-12 h-16 rounded-lg bg-[#f2f2f7] flex-shrink-0 border border-[#e5e5ea]" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-medium text-[#1d1d1f] truncate">{s.name}</span>
                    <span className="text-xs text-[#8e8e93] flex-shrink-0">{s.year}</span>
                  </div>
                  <p className="text-xs text-[#8e8e93] mb-1.5">
                    {ownedCount} / {s.totalCardsCount > 0 ? s.totalCardsCount : "?"} · {pct}% ·{" "}
                    <span className={s.displayMode === "missing_only" ? "text-[#ff9f0a]" : "text-[#34c759]"}>
                      {s.displayMode === "missing_only" ? "jen chybějící" : "celý checklist"}
                    </span>
                  </p>
                  <div className="h-1.5 bg-[#e5e5ea] rounded-full overflow-hidden max-w-[200px]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct === 100 ? "#34c759" : pct > 50 ? "#007aff" : "#ff9f0a",
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/kartickar/${s.slug}`}
                    target="_blank"
                    className="p-2 text-[#8e8e93] hover:text-[#007aff] hover:bg-[#f0f6ff] rounded-xl transition-colors"
                    title="Zobrazit veřejně"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                  <Link
                    href={`/admin/kartickar/${s.id}`}
                    className="px-3 py-1.5 text-sm font-medium text-[#007aff] bg-[#f0f6ff] hover:bg-[#e0eeff] rounded-xl transition-colors"
                  >
                    Spravovat
                  </Link>
                  <CardSeriesDeleteButton id={s.id} name={s.name} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
