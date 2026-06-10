"use client"

import { useState } from "react"
import type { Card, CardVariant } from "@/types"

interface Props {
  initialCards: Card[]
  totalCardsCount: number
}

export default function CardVariantManager({ initialCards, totalCardsCount }: Props) {
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")

  const ownedCount = cards.flatMap((c) => c.variants ?? []).filter((v) => v.isOwned).length
  const totalVariants = cards.flatMap((c) => c.variants ?? []).length
  const pct = totalCardsCount > 0 ? Math.min(100, Math.round((ownedCount / totalCardsCount) * 100)) : 0

  async function toggleVariant(cardId: string, variant: CardVariant) {
    if (toggling.has(variant.id)) return
    setToggling((s) => new Set(s).add(variant.id))
    const newOwned = !variant.isOwned
    setCards((prev) =>
      prev.map((c) =>
        c.id !== cardId
          ? c
          : {
              ...c,
              variants: c.variants?.map((v) =>
                v.id === variant.id ? { ...v, isOwned: newOwned } : v
              ),
            }
      )
    )
    try {
      await fetch(`/api/card-variants/${variant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOwned: newOwned }),
      })
    } catch {
      setCards((prev) =>
        prev.map((c) =>
          c.id !== cardId
            ? c
            : {
                ...c,
                variants: c.variants?.map((v) =>
                  v.id === variant.id ? { ...v, isOwned: variant.isOwned } : v
                ),
              }
        )
      )
    } finally {
      setToggling((s) => {
        const next = new Set(s)
        next.delete(variant.id)
        return next
      })
    }
  }

  const filtered = search.trim()
    ? cards.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.number.toLowerCase().includes(search.toLowerCase())
      )
    : cards

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1d1d1f]">Správa sbírky</h2>
          <p className="text-sm text-[#8e8e93]">
            {ownedCount} / {totalCardsCount || totalVariants} variant vlastněno
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#007aff]">{pct}%</div>
        </div>
      </div>

      <div className="h-2.5 bg-[#e5e5ea] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#34c759] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {cards.length > 0 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hledat kartu..."
          className="w-full px-3.5 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
        />
      )}

      {cards.length === 0 ? (
        <p className="text-sm text-[#8e8e93] text-center py-4">
          Zatím žádné karty — použijte sekci Import výše.
        </p>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto -mx-1 px-1">
          {filtered.map((card) => (
            <div key={card.id} className="border border-[#e5e5ea] rounded-xl p-3">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-xs font-mono text-[#8e8e93] bg-[#f2f2f7] px-1.5 py-0.5 rounded-md">
                  #{card.number}
                </span>
                <span className="text-sm font-medium text-[#1d1d1f]">{card.name}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {card.variants?.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => toggleVariant(card.id, variant)}
                    disabled={toggling.has(variant.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-60 ${
                      variant.isOwned
                        ? "bg-[#f0fff4] text-[#34c759] border-[#34c759]/30"
                        : "bg-[#f2f2f7] text-[#8e8e93] border-[#e5e5ea] hover:bg-[#fff2f0] hover:text-[#ff3b30] hover:border-[#ff3b30]/30"
                    }`}
                  >
                    {variant.isOwned ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {variant.variantName}
                    {variant.limitNumber != null && (
                      <span className="opacity-70">/{variant.limitNumber}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
