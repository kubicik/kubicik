"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { CardTag } from "@/types"

const PRESET_COLORS = [
  "#007aff", "#34c759", "#ff9f0a", "#ff3b30", "#af52de",
  "#5ac8fa", "#ff2d55", "#30d158", "#0071e3", "#636366",
]

interface Props {
  initial?: CardTag
}

export default function CardTagForm({ initial }: Props) {
  const router = useRouter()
  const isEdit = !!initial

  const [name, setName] = useState(initial?.name ?? "")
  const [color, setColor] = useState(initial?.color ?? "#007aff")
  const [symbol, setSymbol] = useState(initial?.symbol ?? "🏷️")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    const res = await fetch(isEdit ? `/api/card-tags/${initial!.id}` : "/api/card-tags", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color, symbol: symbol.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Chyba při ukládání")
      setSaving(false)
      return
    }
    router.push("/admin/kartickar/tags")
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 space-y-5 max-w-lg">
      {error && <div className="px-4 py-3 bg-[#fff2f0] text-[#ff3b30] text-sm rounded-xl">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Název štítku</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="např. Limitovaná edice"
          className="w-full px-3.5 py-2.5 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">Symbol (emoji nebo text)</label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          required
          placeholder="🏷️"
          className="w-full px-3.5 py-2.5 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#3c3c43] mb-2">Barva</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full border-2 transition-all"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "#1d1d1f" : "transparent",
                transform: color === c ? "scale(1.15)" : "scale(1)",
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded-xl border border-[#e5e5ea] cursor-pointer"
          />
          <span className="text-sm text-[#8e8e93]">{color}</span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {symbol} {name || "Náhled"}
          </span>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] disabled:opacity-50 transition-colors"
        >
          {saving ? "Ukládám..." : isEdit ? "Uložit změny" : "Vytvořit štítek"}
        </button>
      </div>
    </form>
  )
}
