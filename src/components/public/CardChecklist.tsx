"use client"

import { useState } from "react"
import type { CardSubset, Card, CardVariant } from "@/types"

interface Props {
  seriesId: string
  subsets: CardSubset[]
  displayMode: "missing_only" | "full_collection"
  showImages?: boolean
}

function bestImage(card: Card): string | null {
  if (card.imageUrl) return card.imageUrl
  return card.variants?.find((v) => v.imageUrl)?.imageUrl ?? null
}

export default function CardChecklist({ seriesId, subsets, displayMode, showImages }: Props) {
  const [search, setSearch] = useState("")

  const allCards = subsets.flatMap((sub) => sub.cards ?? [])

  if (allCards.length === 0) {
    return <p className="text-center text-[#8e8e93] py-12">Checklist zatím není k dispozici.</p>
  }

  const cardsWithImages = showImages ? allCards.filter((c) => bestImage(c)) : []

  return (
    <div className="space-y-8">
      {cardsWithImages.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#8e8e93] uppercase tracking-widest mb-3">Galerie</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {cardsWithImages.map((card) => (
              <div key={card.id} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bestImage(card)!}
                  alt={card.name}
                  className="w-full aspect-[2/3] object-cover rounded-xl border border-[#e5e5ea] shadow-sm"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end p-1.5">
                  <p className="text-white text-[10px] font-medium leading-tight">
                    <span className="text-white/70">#{card.number}</span> {card.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Hledat kartu..."
        className="w-full px-4 py-2.5 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] bg-white"
      />

      {subsets.map((subset) => {
        const cards = subset.cards ?? []
        // Only show parallels that are being collected
        const parallels = (subset.parallels ?? []).filter((p) => p.isCollected)
        const collectedParallelIds = new Set(parallels.map((p) => p.id))

        let visible = cards
        if (displayMode === "missing_only") {
          visible = cards
            .map((c) => ({
              ...c,
              variants: (c.variants ?? []).filter((v) => collectedParallelIds.has(v.parallelId) && !v.isOwned),
            }))
            .filter((c) => c.variants.length > 0)
        }

        const filtered = search.trim()
          ? visible.filter(
              (c) =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.number.toLowerCase().includes(search.toLowerCase())
            )
          : visible

        if (filtered.length === 0 && displayMode === "missing_only") return null

        return (
          <div key={subset.id}>
            {subset.imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden mb-4 border border-[#e5e5ea]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={subset.imageUrl} alt={subset.name} className="w-full h-36 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-end justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">{subset.name}</h3>
                    {parallels.length > 1 && (
                      <p className="text-xs text-white/70 mt-0.5">{parallels.map((p) => p.name + (p.limitNumber ? ` /${p.limitNumber}` : "")).join(", ")}</p>
                    )}
                  </div>
                  <a
                    href={`/api/card-series/${seriesId}/export-csv?subsetId=${subset.id}`}
                    download
                    className="flex-shrink-0 flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
                    title="Exportovat tento subset"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    CSV
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{subset.isSpecial ? "✨" : "📦"}</span>
                <h3 className="text-sm font-semibold text-[#3c3c43]">{subset.name}</h3>
                {parallels.length > 1 && (
                  <>
                    <span className="text-xs text-[#8e8e93]">·</span>
                    <span className="text-xs text-[#8e8e93]">{parallels.map((p) => p.name + (p.limitNumber ? ` /${p.limitNumber}` : "")).join(", ")}</span>
                  </>
                )}
                <a
                  href={`/api/card-series/${seriesId}/export-csv?subsetId=${subset.id}`}
                  download
                  className="ml-auto flex-shrink-0 flex items-center gap-1 text-xs text-[#8e8e93] hover:text-[#007aff] transition-colors"
                  title="Exportovat tento subset"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  CSV
                </a>
              </div>
            )}

            {displayMode === "missing_only" && (
              <p className="text-sm text-[#8e8e93] mb-3">Chybí {filtered.length} karet.</p>
            )}

            <div className="space-y-2">
              {filtered.length === 0 ? (
                <p className="text-center text-[#8e8e93] py-6">
                  {search ? "Žádná karta neodpovídá hledání." : "Všechny karty jsou nasbírány! 🎉"}
                </p>
              ) : (
                filtered.map((card) => <CardRow key={card.id} card={card} parallels={parallels} displayMode={displayMode} showImages={showImages} />)
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CardRow({
  card,
  parallels,
  displayMode,
  showImages,
}: {
  card: Card
  parallels: { id: string; name: string; limitNumber: number | null }[]
  displayMode: "missing_only" | "full_collection"
  showImages?: boolean
}) {
  const allOwned = card.variants?.every((v) => v.isOwned) ?? false
  const variantMap = new Map<string, CardVariant>(card.variants?.map((v) => [v.parallelId, v]) ?? [])
  const cardImage = showImages ? bestImage(card) : null

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
        displayMode === "full_collection" && allOwned
          ? "border-[#e5e5ea] bg-[#f2f2f7] opacity-60"
          : "border-[#e5e5ea] bg-white"
      }`}
    >
      {cardImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cardImage} alt={card.name} className="w-8 h-10 object-cover rounded-md border border-[#e5e5ea] flex-shrink-0" />
      ) : (
        <div className="flex-shrink-0 mt-0.5">
          {displayMode === "full_collection" && allOwned ? (
            <div className="w-5 h-5 rounded-full bg-[#34c759] flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-[#ff3b30]/60 bg-[#fff2f0]" />
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-mono text-[#8e8e93]">#{card.number}</span>
          <span className={`text-sm font-medium ${displayMode === "full_collection" && allOwned ? "text-[#8e8e93] line-through" : "text-[#1d1d1f]"}`}>
            {card.name}
          </span>
          {card.club && (
            <span className="text-xs text-[#8e8e93] truncate">{card.club}</span>
          )}
        </div>

        {parallels.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {parallels.map((p) => {
              const v = variantMap.get(p.id)
              const owned = v?.isOwned ?? false
              const variantImage = showImages ? v?.imageUrl : null
              return (
                <div key={p.id} className="flex items-center gap-1">
                  {variantImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={variantImage} alt={p.name} className="w-5 h-7 object-cover rounded border border-[#e5e5ea]" />
                  )}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                      owned ? "bg-[#f0fff4] text-[#34c759]" : "bg-[#fff2f0] text-[#ff3b30]"
                    }`}
                  >
                    {owned ? "✓" : "✗"} {p.name}
                    {p.limitNumber != null && <span className="opacity-70">/{p.limitNumber}</span>}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
