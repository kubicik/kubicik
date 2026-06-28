"use client"

import { useState } from "react"

const SUBSET_AI_PROMPT = `Jsi expert na čištění dat a strukturování textu. Dostaneš surový textový seznam karet pro jeden subset.
Tvým úkolem je převést ho do validního JSON formátu. Žádný text okolo.

Struktura:
{
  "parallels": [
    { "name": "Base", "limit_number": null },
    { "name": "Blue", "limit_number": 199 },
    { "name": "Gold", "limit_number": 25 }
  ],
  "cards": [
    { "number": "1", "name": "Erling Haaland", "club": "Manchester City" },
    { "number": "2", "name": "Phil Foden", "club": "Manchester City" },
    { "number": "3", "name": "Bukayo Saka", "club": "Arsenal" }
  ]
}

Pravidla:
1. "parallels" jsou verze platné pro CELÝ subset — všechny karty mají tyto verze.
2. "limit_number" je číslo limitu (např. "/99" → 99) nebo null pro neomezené.
3. "club" je klub/tým hráče — pokud není k dispozici, použij null.
4. Výstup musí být jen čistý JSON, bez textu před ani za ním.

Zde je surový text ke zpracování:
[ZDE VLOŽTE TEXT CHECKLISTU]`

interface ImportResult {
  created: number
  updated: number
  variantsAdded: number
}

interface Props {
  subsetId: string
  onImportComplete: () => void
  onCancel: () => void
}

export default function CardSubsetImport({ subsetId, onImportComplete, onCancel }: Props) {
  const [jsonInput, setJsonInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
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
      setError("Neplatný JSON.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/card-subsets/${subsetId}/import`, {
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
    await navigator.clipboard.writeText(SUBSET_AI_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0

  if (result) {
    return (
      <div className="mt-3 p-4 border border-[#e5e5ea] rounded-xl bg-[#f9f9fb] space-y-3">
        <div className="px-3 py-2 bg-[#f0fff4] text-[#34c759] text-sm rounded-lg">
          Import dokončen — {result.created} nových karet, {result.updated} aktualizováno, {result.variantsAdded} variant přidáno.
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { onImportComplete(); }}
            className="px-4 py-1.5 bg-[#007aff] text-white text-sm font-medium rounded-lg hover:bg-[#0066d6]"
          >
            Načíst aktualizovaná data
          </button>
          <button onClick={onCancel} className="text-sm text-[#8e8e93] hover:text-[#1d1d1f]">
            Zavřít
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 p-4 border border-[#e5e5ea] rounded-xl bg-[#f9f9fb] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#1d1d1f]">Import karet z AI</span>
        <div className="flex items-center gap-2">
          <button
            onClick={copyPrompt}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#007aff] bg-white border border-[#e5e5ea] rounded-lg hover:bg-[#f0f6ff] transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Zkopírováno
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                AI prompt
              </>
            )}
          </button>
          <button onClick={onCancel} className="text-xs text-[#8e8e93] hover:text-[#1d1d1f]">Zrušit</button>
        </div>
      </div>

      <textarea
        value={jsonInput}
        onChange={(e) => { setJsonInput(e.target.value); setResult(null) }}
        disabled={loading}
        placeholder={'{\n  "parallels": [{ "name": "Base", "limit_number": null }],\n  "cards": [{ "number": "1", "name": "Haaland", "club": "Man City" }]\n}'}
        rows={6}
        className="w-full px-3 py-2 text-xs font-mono border border-[#e5e5ea] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007aff]/30 focus:border-[#007aff] resize-y disabled:opacity-50 bg-white"
      />

      {loading && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#3c3c43]">
            <span>{progress ? `${progress.done} / ${progress.total} karet` : "Připravuji…"}</span>
            {progress && <span className="font-semibold text-[#007aff]">{pct}%</span>}
          </div>
          <div className="h-1.5 bg-[#e5e5ea] rounded-full overflow-hidden">
            <div className="h-full bg-[#007aff] rounded-full transition-all" style={{ width: progress ? `${pct}%` : "0%" }} />
          </div>
        </div>
      )}

      {error && (
        <div className="px-3 py-2 bg-[#fff2f0] text-[#ff3b30] text-xs rounded-lg">{error}</div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleImport}
          disabled={loading || !jsonInput.trim()}
          className="px-4 py-1.5 bg-[#007aff] text-white text-sm font-medium rounded-lg hover:bg-[#0066d6] disabled:opacity-50 transition-colors"
        >
          {loading ? "Importuji…" : "Importovat"}
        </button>
      </div>
    </div>
  )
}
