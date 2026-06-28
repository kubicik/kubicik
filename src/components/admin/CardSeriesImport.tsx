"use client"

import { useState } from "react"

const AI_PROMPT = `Jsi expert na čištění dat a strukturování textu. Dostaneš surový textový seznam (checklist) kartiček. Tvým úkolem je analyzovat text a převést ho do validního JSON formátu.

Výstupem musí být pole subsetů (skupin karet). Žádný text okolo.

Struktura:
[
  {
    "subset": "Base",
    "is_special": false,
    "parallels": [
      { "name": "Base", "limit_number": null },
      { "name": "Blue", "limit_number": 199 },
      { "name": "Gold", "limit_number": 25 }
    ],
    "cards": [
      { "number": "1", "name": "Erling Haaland" },
      { "number": "2", "name": "Phil Foden" }
    ]
  },
  {
    "subset": "Gold Inserts",
    "is_special": true,
    "parallels": [
      { "name": "Base", "limit_number": null }
    ],
    "cards": [
      { "number": "GI-1", "name": "Erling Haaland" }
    ]
  }
]

Pravidla:
1. "parallels" jsou verze platné pro CELÝ subset — všechny karty v subsetu mají tyto verze.
2. "limit_number" je číslo limitu (např. "/99" → 99) nebo null pro neomezené karty.
3. Pokud je to jednoduchý seznam bez subsetů, dejte vše do jednoho subsetu "Base" s "is_special": false.
4. Speciální inserty (Gold, Signatures, atd.) = "is_special": true s vlastním polem "cards".
5. Výstup musí být jen čistý JSON, bez textu před ani za ním.

Zde je surový text ke zpracování:
[ZDE VLOŽTE TEXT CHECKLISTU]`

interface ImportResult {
  created: number
  updated: number
  variantsAdded: number
}

interface Progress {
  done: number
  total: number
}

export default function CardSeriesImport({ seriesId }: { seriesId: string }) {
  const [jsonInput, setJsonInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  async function handleImport() {
    setError("")
    setResult(null)
    setProgress(null)
    setLoading(true)

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonInput.trim())
    } catch {
      setError("Neplatný JSON. Zkontrolujte výstup z AI.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/card-series/${seriesId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "Chyba importu")
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.trim()) continue
          const msg = JSON.parse(line) as {
            done?: number; total?: number
            ok?: boolean; created?: number; updated?: number; variantsAdded?: number
            error?: string
          }
          if (msg.error) throw new Error(msg.error)
          if (msg.ok) {
            setResult({ created: msg.created!, updated: msg.updated!, variantsAdded: msg.variantsAdded! })
            setProgress(null)
            setJsonInput("")
          } else if (msg.total) {
            setProgress({ done: msg.done!, total: msg.total })
          }
        }
      }
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

  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0

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
          onChange={(e) => { setJsonInput(e.target.value); setResult(null) }}
          disabled={loading}
          placeholder={'[\n  {\n    "subset": "Base",\n    "is_special": false,\n    "parallels": [{ "name": "Base", "limit_number": null }],\n    "cards": [{ "number": "1", "name": "Erling Haaland" }]\n  }\n]'}
          rows={8}
          className="w-full px-3.5 py-2.5 text-sm font-mono border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] resize-y disabled:opacity-50"
        />
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#3c3c43]">
              {progress ? `Zpracováno ${progress.done} / ${progress.total} karet` : "Připravuji import…"}
            </span>
            {progress && (
              <span className="font-semibold text-[#007aff] tabular-nums">{pct} %</span>
            )}
          </div>
          <div className="h-2.5 bg-[#e5e5ea] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#007aff] rounded-full transition-all duration-200"
              style={{ width: progress ? `${pct}%` : "0%" }}
            />
          </div>
        </div>
      )}

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
          {loading ? "Importuji…" : "Importovat karty"}
        </button>
      </div>
    </div>
  )
}
