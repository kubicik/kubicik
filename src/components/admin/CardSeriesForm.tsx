"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { compressImage } from "@/lib/compressImage"
import type { CardSeries } from "@/types"

interface Props {
  initial?: CardSeries
}

export default function CardSeriesForm({ initial }: Props) {
  const router = useRouter()
  const isEdit = !!initial

  const [name, setName] = useState(initial?.name ?? "")
  const [year, setYear] = useState(initial?.year?.toString() ?? new Date().getFullYear().toString())
  const [tier, setTier] = useState<"premium" | "regular">(initial?.tier ?? "regular")
  const [displayMode, setDisplayMode] = useState<"missing_only" | "full_collection">(initial?.displayMode ?? "missing_only")
  const [totalCardsCount, setTotalCardsCount] = useState(initial?.totalCardsCount?.toString() ?? "0")
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

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
    try {
      const payload = {
        name: name.trim(),
        year: Number(year),
        tier,
        displayMode,
        totalCardsCount: Number(totalCardsCount),
        imageUrl: imageUrl || null,
      }
      const res = await fetch(isEdit ? `/api/card-series/${initial!.id}` : "/api/card-series", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Chyba při ukládání")
      router.push(isEdit ? `/admin/kartickar/${initial!.id}` : `/admin/kartickar/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při ukládání")
      setSaving(false)
    }
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

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="px-6 py-2.5 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] disabled:opacity-50 transition-colors"
        >
          {saving ? "Ukládám..." : isEdit ? "Uložit změny" : "Vytvořit sérii"}
        </button>
      </div>
    </form>
  )
}
