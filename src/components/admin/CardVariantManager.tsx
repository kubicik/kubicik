"use client"

import { useState, useMemo } from "react"
import { compressImage } from "@/lib/compressImage"
import type { Card, CardVariant } from "@/types"

interface Props {
  seriesId: string
  initialCards: Card[]
  totalCardsCount: number
  isPricingEnabled: boolean
}

export default function CardVariantManager({ seriesId, initialCards, totalCardsCount, isPricingEnabled }: Props) {
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null)
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialCards.map((c) => [c.id, c.price != null ? String(c.price) : ""]))
  )
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null)

  const [missingInput, setMissingInput] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ owned: number; missing: number } | null>(null)

  const ownedCount = cards.flatMap((c) => c.variants ?? []).filter((v) => v.isOwned).length
  const totalVariants = cards.flatMap((c) => c.variants ?? []).length
  const pct = totalCardsCount > 0 ? Math.min(100, Math.round((ownedCount / totalCardsCount) * 100)) : 0
  const collectionValue = isPricingEnabled
    ? cards.reduce((sum, c) => sum + (c.price ?? 0) * (c.variants?.filter((v) => v.isOwned).length ?? 0), 0)
    : 0

  const parsedMissing = useMemo(() => {
    return missingInput.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)
  }, [missingInput])

  const missingSet = useMemo(() => new Set(parsedMissing), [parsedMissing])

  const bulkPreview = useMemo(() => {
    if (!parsedMissing.length || !cards.length) return null
    const missingCards = cards.filter((c) => missingSet.has(c.number)).length
    const ownedCards = cards.length - missingCards
    return { ownedCards, missingCards }
  }, [parsedMissing, missingSet, cards])

  async function applyBulkOwn() {
    setBulkLoading(true)
    setBulkResult(null)
    try {
      const res = await fetch(`/api/card-series/${seriesId}/bulk-own`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missingNumbers: parsedMissing }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCards((prev) =>
        prev.map((c) => ({
          ...c,
          variants: c.variants?.map((v) => ({ ...v, isOwned: !missingSet.has(c.number) })),
        }))
      )
      setBulkResult({ owned: data.owned, missing: data.missing })
      setMissingInput("")
    } finally {
      setBulkLoading(false)
    }
  }

  async function toggleVariant(cardId: string, variant: CardVariant) {
    if (toggling.has(variant.id)) return
    setToggling((s) => new Set(s).add(variant.id))
    const newOwned = !variant.isOwned
    setCards((prev) =>
      prev.map((c) =>
        c.id !== cardId
          ? c
          : { ...c, variants: c.variants?.map((v) => (v.id === variant.id ? { ...v, isOwned: newOwned } : v)) }
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
            : { ...c, variants: c.variants?.map((v) => (v.id === variant.id ? { ...v, isOwned: variant.isOwned } : v)) }
        )
      )
    } finally {
      setToggling((s) => { const next = new Set(s); next.delete(variant.id); return next })
    }
  }

  async function handleCardImageUpload(cardId: string, file: File) {
    setUploadingCardId(cardId)
    try {
      const compressed = await compressImage(file, "cards")
      const fd = new FormData()
      fd.append("file", compressed)
      fd.append("type", "cards")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")

      await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: data.url }),
      })
      setCards((prev) => prev.map((c) => c.id === cardId ? { ...c, imageUrl: data.url } : c))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Chyba uploadu")
    } finally {
      setUploadingCardId(null)
    }
  }

  async function removeCardImage(cardId: string) {
    await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: null }),
    })
    setCards((prev) => prev.map((c) => c.id === cardId ? { ...c, imageUrl: null } : c))
  }

  async function updateCardPrice(cardId: string) {
    const raw = priceInputs[cardId] ?? ""
    const price = raw === "" ? null : Number(raw)
    const current = cards.find((c) => c.id === cardId)?.price ?? null
    if (price === current) return
    setSavingPriceId(cardId)
    try {
      await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      })
      setCards((prev) => prev.map((c) => c.id === cardId ? { ...c, price } : c))
    } finally {
      setSavingPriceId(null)
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
          {isPricingEnabled && collectionValue > 0 && (
            <p className="text-sm text-[#34c759] font-medium mt-0.5">
              Hodnota: {Math.round(collectionValue).toLocaleString("cs-CZ")} Kč
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#007aff]">{pct}%</div>
        </div>
      </div>

      <div className="h-2.5 bg-[#e5e5ea] rounded-full overflow-hidden">
        <div className="h-full bg-[#34c759] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {cards.length > 0 && (
        <div className="border border-[#e5e5ea] rounded-xl p-4 space-y-3 bg-[#f9f9fb]">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-0.5">
              Čísla chybějících karet
            </label>
            <p className="text-xs text-[#8e8e93] mb-2">
              Zadejte čísla karet, které <strong>nemáte</strong> — všechny ostatní se označí jako vlastněné.
            </p>
            <input
              type="text"
              value={missingInput}
              onChange={(e) => { setMissingInput(e.target.value); setBulkResult(null) }}
              placeholder="5, 23, 47, 150, G-12"
              className="w-full px-3.5 py-2 text-sm font-mono border border-[#e5e5ea] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
            />
          </div>

          {bulkPreview && (
            <p className="text-xs text-[#3c3c43]">
              <span className="text-[#34c759] font-medium">{bulkPreview.ownedCards} karet</span> se označí jako vlastněné,{" "}
              <span className="text-[#ff3b30] font-medium">{bulkPreview.missingCards} karet</span> jako chybějící
              {parsedMissing.filter((n) => !cards.some((c) => c.number === n)).length > 0 && (
                <span className="text-[#ff9f0a]">
                  {" "}(neznámá čísla: {parsedMissing.filter((n) => !cards.some((c) => c.number === n)).join(", ")})
                </span>
              )}
            </p>
          )}

          {bulkResult && (
            <p className="text-xs text-[#34c759]">
              Hotovo — {bulkResult.owned} variant označeno jako vlastněné, {bulkResult.missing} jako chybějící.
            </p>
          )}

          <button
            onClick={applyBulkOwn}
            disabled={bulkLoading || parsedMissing.length === 0}
            className="px-4 py-2 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] disabled:opacity-40 transition-colors"
          >
            {bulkLoading ? "Ukládám..." : "Použít"}
          </button>
        </div>
      )}

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
              <div className="flex items-start gap-2 mb-2">
                {card.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-8 h-10 object-cover rounded-md border border-[#e5e5ea] flex-shrink-0"
                  />
                )}
                <div className="flex-1 flex items-baseline gap-2">
                  <span className="text-xs font-mono text-[#8e8e93] bg-[#f2f2f7] px-1.5 py-0.5 rounded-md">
                    #{card.number}
                  </span>
                  <span className="text-sm font-medium text-[#1d1d1f]">{card.name}</span>
                </div>
                <label
                  className={`flex-shrink-0 p-1.5 rounded-lg cursor-pointer transition-colors ${
                    uploadingCardId === card.id
                      ? "opacity-50 pointer-events-none"
                      : "text-[#8e8e93] hover:text-[#007aff] hover:bg-[#f0f6ff]"
                  }`}
                  title="Nahrát obrázek karty"
                >
                  {uploadingCardId === card.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCardImageUpload(card.id, f) }}
                    disabled={uploadingCardId === card.id}
                  />
                </label>
                {card.imageUrl && (
                  <button
                    onClick={() => removeCardImage(card.id)}
                    className="flex-shrink-0 p-1.5 text-[#8e8e93] hover:text-[#ff3b30] hover:bg-[#fff2f0] rounded-lg transition-colors"
                    title="Odebrat obrázek"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {isPricingEnabled && (
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs text-[#8e8e93] flex-shrink-0">Cena (Kč):</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="—"
                    value={priceInputs[card.id] ?? ""}
                    onChange={(e) => setPriceInputs((prev) => ({ ...prev, [card.id]: e.target.value }))}
                    onBlur={() => updateCardPrice(card.id)}
                    disabled={savingPriceId === card.id}
                    className="w-24 px-2.5 py-1 text-xs border border-[#e5e5ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] disabled:opacity-50"
                  />
                  {savingPriceId === card.id && (
                    <svg className="w-3.5 h-3.5 animate-spin text-[#007aff]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </div>
              )}
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
                    {variant.limitNumber != null && <span className="opacity-70">/{variant.limitNumber}</span>}
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
