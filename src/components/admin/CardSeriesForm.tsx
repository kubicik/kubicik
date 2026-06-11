"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { compressImage } from "@/lib/compressImage"
import type { CardSeries, CardTag } from "@/types"

interface Props {
  initial?: CardSeries
}

export default function CardSeriesForm({ initial }: Props) {
  const router = useRouter()
  const isEdit = !!initial

  const [name, setName] = useState(initial?.name ?? "")
  const [year, setYear] = useState(initial?.year?.toString() ?? new Date().getFullYear().toString())
  const [sport, setSport] = useState<"football" | "hockey" | "basketball">(initial?.sport ?? "football")
  const [tier, setTier] = useState<"premium" | "regular">(initial?.tier ?? "regular")
  const [displayMode, setDisplayMode] = useState<"missing_only" | "full_collection">(initial?.displayMode ?? "missing_only")
  const [totalCardsCount, setTotalCardsCount] = useState(initial?.totalCardsCount?.toString() ?? "0")
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "")
  const [isPricingEnabled, setIsPricingEnabled] = useState(initial?.isPricingEnabled ?? false)
  const [pricePerCard, setPricePerCard] = useState(initial?.pricePerCard?.toString() ?? "")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initial?.tags?.map((t) => t.id) ?? [])
  const [availableTags, setAvailableTags] = useState<CardTag[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStep, setSaveStep] = useState<"idle" | "sending" | "done">("idle")
  const [slowWarning, setSlowWarning] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/card-tags")
      .then((r) => r.json())
      .then(setAvailableTags)
      .catch(() => {})
  }, [])

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const compressed = await compressImage(file, "covers")
      const fd = new FormData()
      fd.append("file", compressed)
      fd.append("type", "covers")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      setImageUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba uploadu")
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSaving(true)
    setSaveStep("sending")
    setSlowWarning(false)

    const slowTimer = setTimeout(() => setSlowWarning(true), 4000)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)

      const payload = {
        name: name.trim(),
        year: Number(year),
        sport,
        tier,
        displayMode,
        totalCardsCount: Number(totalCardsCount),
        imageUrl: imageUrl || null,
        isPricingEnabled,
        pricePerCard: isPricingEnabled && pricePerCard ? Number(pricePerCard) : null,
        tagIds: selectedTagIds,
      }
      const res = await fetch(isEdit ? `/api/card-series/${initial!.id}` : "/api/card-series", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Chyba při ukládání")

      setSaveStep("done")
      setTimeout(() => {
        router.push(isEdit ? `/admin/kartickar/${initial!.id}` : `/admin/kartickar/${data.id}`)
      }, 500)
    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === "AbortError" ? "Požadavek vypršel — zkuste to znovu" : err.message)
        : "Chyba při ukládání"
      setError(msg)
      setSaving(false)
      setSaveStep("idle")
    } finally {
      clearTimeout(slowTimer)
      setSlowWarning(false)
    }
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 space-y-5">
      {error && (
        <div className="px-4 py-3 bg-[#fff2f0] text-[#ff3b30] text-sm rounded-xl">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Název série</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Panini FIFA 365 2026"
            className="w-full px-3.5 py-2.5 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Rok vydání</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            min="1970"
            max="2100"
            className="w-full px-3.5 py-2.5 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Celkový počet karet</label>
          <input
            type="number"
            value={totalCardsCount}
            onChange={(e) => setTotalCardsCount(e.target.value)}
            min="0"
            className="w-full px-3.5 py-2.5 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#3c3c43] mb-2">Sport</label>
        <div className="flex gap-3">
          {([
            { value: "football", label: "⚽ Fotbal" },
            { value: "hockey",   label: "🏒 Hokej" },
            { value: "basketball", label: "🏀 Basketbal" },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSport(value)}
              className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                sport === value
                  ? "bg-[#007aff] text-white border-[#007aff]"
                  : "bg-white text-[#3c3c43] border-[#e5e5ea] hover:bg-[#f2f2f7]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#3c3c43] mb-2">Kategorie sbírky</label>
        <div className="flex gap-3">
          {(["regular", "premium"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                tier === t
                  ? t === "premium"
                    ? "bg-[#ff9f0a] text-white border-[#ff9f0a]"
                    : "bg-[#007aff] text-white border-[#007aff]"
                  : "bg-white text-[#3c3c43] border-[#e5e5ea] hover:bg-[#f2f2f7]"
              }`}
            >
              {t === "premium" ? "⭐ Prémiová" : "Řadová"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#3c3c43] mb-2">Režim zobrazení na webu</label>
        <div className="flex gap-3">
          {(["missing_only", "full_collection"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDisplayMode(mode)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                displayMode === mode
                  ? "bg-[#007aff] text-white border-[#007aff]"
                  : "bg-white text-[#3c3c43] border-[#e5e5ea] hover:bg-[#f2f2f7]"
              }`}
            >
              {mode === "missing_only" ? "Jen chybějící" : "Celý checklist"}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-[#8e8e93]">
          {displayMode === "missing_only"
            ? "Veřejně zobrazí pouze karty, které ještě nemáte."
            : "Veřejně zobrazí celý seznam — vlastněné karty budou označeny."}
        </p>
      </div>

      {availableTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[#3c3c43] mb-2">Štítky</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const active = selectedTagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    active ? "text-white border-transparent" : "text-[#3c3c43] border-[#e5e5ea] bg-white hover:bg-[#f2f2f7]"
                  }`}
                  style={active ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
                >
                  {tag.symbol} {tag.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-[#3c3c43]">Sledování ceny</label>
          <button
            type="button"
            onClick={() => setIsPricingEnabled(!isPricingEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isPricingEnabled ? "bg-[#34c759]" : "bg-[#e5e5ea]"}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPricingEnabled ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </div>
        {isPricingEnabled && (
          <div>
            <label className="block text-xs text-[#8e8e93] mb-1.5">Cena za kartu (Kč)</label>
            <input
              type="number"
              value={pricePerCard}
              onChange={(e) => setPricePerCard(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0"
              className="w-48 px-3.5 py-2.5 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
            />
            <p className="mt-1 text-xs text-[#8e8e93]">Hodnota sbírky = počet vlastněných karet × cena</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Vzorový obrázek série</label>
        <div className="flex items-start gap-3">
          {imageUrl && (
            <div className="relative w-20 h-28 rounded-xl overflow-hidden border border-[#e5e5ea] flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-dashed border-[#c7c7cc] text-[#8e8e93] hover:bg-[#f2f2f7] cursor-pointer transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              {uploading ? "Nahrávání..." : "Vybrat obrázek"}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploading} />
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3 min-h-[20px]">
          {saving && saveStep === "sending" && (
            <div className="flex items-center gap-2 text-sm text-[#8e8e93]">
              <svg className="w-4 h-4 animate-spin text-[#007aff]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {slowWarning ? "Ukládám, připojení je pomalé…" : "Ukládám…"}
            </div>
          )}
          {saveStep === "done" && (
            <div className="flex items-center gap-2 text-sm text-[#34c759]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Uloženo
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all disabled:cursor-not-allowed ${
            saveStep === "done"
              ? "bg-[#34c759] text-white"
              : "bg-[#007aff] text-white hover:bg-[#0066d6] disabled:opacity-50"
          }`}
        >
          {saveStep === "done" ? "✓ Uloženo" : saving ? "Ukládám…" : isEdit ? "Uložit změny" : "Vytvořit sérii"}
        </button>
      </div>
    </form>
  )
}
