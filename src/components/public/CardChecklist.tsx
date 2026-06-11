"use client"

import { useState } from "react"
import type { Card } from "@/types"

interface Props {
  cards: Card[]
  displayMode: "missing_only" | "full_collection"
  showImages?: boolean
}

export default function CardChecklist({ cards, displayMode, showImages }: Props) {
  const [search, setSearch] = useState("")

  const visibleCards =
    displayMode === "missing_only"
      ? cards
          .map((c) => ({ ...c, variants: c.variants?.filter((v) => !v.isOwned) ?? [] }))
          .filter((c) => c.variants.length > 0)
      : cards

  const filtered = search.trim()
    ? visibleCards.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.number.toLowerCase().includes(search.toLowerCase())
      )
    : visibleCards

  if (cards.length === 0) {
    return <p className="text-center text-[#8e8e93] py-12">Checklist zatím není k dispozici.</p>
  }

  const cardsWithImages = showImages ? cards.filter((c) => c.imageUrl) : []

  return (
    <div className="space-y-6">
      {cardsWithImages.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#8e8e93] uppercase tracking-widest mb-3">Galerie</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {cardsWithImages.map((card) => (
              // eslint-disable-next-line @next/next/no-img-element
              <div key={card.id} className="group relative">
                <img
                  src={card.imageUrl!}
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

      <div className="space-y-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hledat kartu..."
          className="w-full px-4 py-2.5 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] bg-white"
        />

        {displayMode === "missing_only" && (
          <p className="text-sm text-[#8e8e93]">Zobrazeno {filtered.length} karet, které ještě chybí.</p>
        )}

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-[#8e8e93] py-8">
              {search ? "Žádná karta neodpovídá hledání." : "Všechny karty jsou již nasbírány! 🎉"}
            </p>
          ) : (
            filtered.map((card) => {
              const allOwned = card.variants?.every((v) => v.isOwned) ?? false
              return (
                <div
                  key={card.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                    displayMode === "full_collection" && allOwned
                      ? "border-[#e5e5ea] bg-[#f2f2f7] opacity-60"
                      : "border-[#e5e5ea] bg-white"
                  }`}
                >
                  {showImages && card.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-8 h-10 object-cover rounded-md border border-[#e5e5ea] flex-shrink-0"
                    />
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
                    </div>

                    {(card.variants?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {card.variants?.map((v) => (
                          <span
                            key={v.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                              v.isOwned ? "bg-[#f0fff4] text-[#34c759]" : "bg-[#fff2f0] text-[#ff3b30]"
                            }`}
                          >
                            {v.isOwned ? "✓" : "✗"} {v.variantName}
                            {v.limitNumber != null && <span className="opacity-70">/{v.limitNumber}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
