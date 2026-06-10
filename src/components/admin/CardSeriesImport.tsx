"use client"

import { useState } from "react"

const AI_PROMPT = `Jsi expert na čištění dat a strukturování textu. Dostaneš surový textový seznam (checklist) fotbalových kartiček. Tvým úkolem je tento text analyzovat, odstranit balast a převést ho do validního formátu JSON.

Pravidla pro formátování:
1. Výstupem musí být čisté pole objektů v JSON. Žádný okecávací text okolo.
2. Každý objekt reprezentuje kartu a musí mít přesně tuto strukturu:
{
  "number": "číslo nebo kód karty",
  "name": "Jméno hráče nebo název karty",
  "variants": [
    { "variant_name": "Název verze, např. Base, Red, Gold", "limit_number": 99 }
  ]
}
3. Pokud text obsahuje informaci o limitaci (např. "/99", "serialized to 25", "1of1"), vyhledej číslo limitu a doplň ho do "limit_number". Pokud limitace nemá číslo (Base karta), nastav "limit_number": null.
4. Pokud řádek obsahuje více verzí pro jednoho hráče, seskup je pod jedno "number" a jednoho hráče do pole "variants".

Zde je surový text ke zpracování:
[ZDE VLOŽTE TEXT CHECKLISTU]`

interface ImportResult {
  created: number
  updated: number
  variantsAdded: number
}

export default function CardSeriesImport({ seriesId }: { seriesId: string }) {
  const [jsonInput, setJsonInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  async function handleImport() {
    setError("")
    setResult(null)
    setLoading(true)
    try {
      let parsed: unknown
      try {
        parsed = JSON.parse(jsonInput.trim())
      } catch {
        throw new Error("Neplatný JSON. Zkontrolujte výstup z AI.")
      }
      const res = await fetch(`/api/card-series/${seriesId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Chyba importu")
      setResult(data)
      setJsonInput("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba importu")
    } finally {
      setLoading(false)
    }
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(AI_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[#1d1d1f] mb-1">Import karet z AI</h2>
        <p className="text-sm text-[#8e8e93]">
          Zkopírujte prompt níže, vložte do něj surový text checklistu a zpracujte v externím AI (Claude, ChatGPT). Výsledný JSON pak vložte do pole níže.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#3c3c43]">Prompt pro AI</span>
          <button
            onClick={copyPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#007aff] bg-[#f0f6ff] rounded-lg hover:bg-[#e0eeff] transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Zkopírováno
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Kopírovat prompt
              </>
            )}
          </button>
        </div>
        <pre className="bg-[#f2f2f7] rounded-xl p-4 text-xs text-[#3c3c43] whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
          {AI_PROMPT}
        </pre>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#3c3c43] mb-1.5">JSON výstup z AI</label>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder={'[\n  {\n    "number": "1",\n    "name": "Erling Haaland",\n    "variants": [{ "variant_name": "Base", "limit_number": null }]\n  }\n]'}
          rows={8}
          className="w-full px-3.5 py-2.5 text-sm font-mono border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] resize-y"
        />
      </div>

      {error && (
        <div className="px-4 py-3 bg-[#fff2f0] text-[#ff3b30] text-sm rounded-xl">{error}</div>
      )}

      {result && (
        <div className="px-4 py-3 bg-[#f0fff4] text-[#34c759] text-sm rounded-xl">
          Import dokončen — {result.created} nových karet, {result.updated} aktualizováno, {result.variantsAdded} variant přidáno.
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleImport}
          disabled={loading || !jsonInput.trim()}
          className="px-6 py-2.5 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] disabled:opacity-50 transition-colors"
        >
          {loading ? "Importuji..." : "Importovat karty"}
        </button>
      </div>
    </div>
  )
}
