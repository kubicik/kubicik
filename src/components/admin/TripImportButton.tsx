"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

const AI_PROMPT = `Vytvoř popis výletu ve formátu JSON podle níže uvedené struktury. Vrať pouze čistý JSON, bez markdownu ani vysvětlení.

{
  "title": "Název výletu",
  "description": "Stručný popis výletu (2–4 věty). Podporuje **tučný text**, *kurzívu*, ==zvýraznění==.",
  "startDate": "RRRR-MM-DD",
  "endDate": "RRRR-MM-DD",
  "country": "Název cílové země",
  "tripType": "roadtrip",
  "participants": ["Jméno1", "Jméno2"],
  "tips": {
    "logistika": ["Každý tip jako samostatný řetězec"],
    "pozor": ["Na co si dát pozor"]
  },
  "stops": [
    {
      "title": "Název zastávky nebo lokace",
      "description": "Detailní popis dne nebo místa. Prázdný řádek odděluje odstavce.\\n\\n> Řádek začínající > je citace nebo osobní poznámka.\\n\\nText ==mezi == je zvýrazněn žlutě. **Tučný text** a *kurzíva* fungují standardně.",
      "date": "RRRR-MM-DD",
      "lat": 50.0755,
      "lng": 14.4378,
      "order": 0,
      "tags": [
        { "emoji": "🚗", "label": "320 km autem" }
      ],
      "photos": []
    }
  ]
}

Pravidla:
- tripType musí být jedna z hodnot: roadtrip, trekking, město, dobrodružství
- lat a lng jsou čísla (ne string), musí být přesné GPS souřadnice
- Zastávky řaď chronologicky, order začíná od 0
- Každá zastávka musí mít title, lat a lng
- Popis zastávky může být delší — piš co se tam dělo, co jsme viděli, jak jsme se cítili`

export default function TripImportButton() {
  const [open, setOpen] = useState(false)
  const [json, setJson] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setJson((ev.target?.result as string) ?? "")
    reader.readAsText(file)
    e.target.value = ""
  }

  function handleClose() {
    setOpen(false)
    setJson("")
    setError("")
  }

  async function handleImport() {
    setError("")
    let data
    try {
      data = JSON.parse(json)
    } catch {
      setError("Neplatný JSON — zkontrolujte formát")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/trips/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || "Chyba při importu")
        return
      }
      handleClose()
      router.push(`/admin/trips/${result.id}`)
    } catch (err) {
      setError(`Chyba: ${err instanceof Error ? err.message : String(err)}`)
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
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white text-[#1d1d1f] text-sm font-medium rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:bg-[#f9f9f9] border border-[#e5e5ea] transition-colors"
      >
        <svg className="w-4 h-4 text-[#8e8e93]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Import / AI prompt
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5ea]">
              <h2 className="font-semibold text-[#1d1d1f]">Import výletu z JSON</h2>
              <button
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center text-[#8e8e93] hover:text-[#1d1d1f] hover:bg-[#f2f2f7] rounded-full transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* AI prompt section */}
              <div className="bg-[#f0f6ff] rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#007aff] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-sm font-medium text-[#007aff]">Vygenerovat výlet pomocí AI</p>
                </div>
                <p className="text-xs text-[#3a3a3c]">
                  Zkopírujte prompt, předejte ho ChatGPT, Claude nebo jiné AI s popisem vašeho výletu. Výsledný JSON pak vložte níže.
                </p>
                <button
                  onClick={copyPrompt}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    copied
                      ? "bg-[#34c759] text-white"
                      : "bg-[#007aff] text-white hover:bg-[#0066d6]"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Zkopírováno!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Kopírovat prompt pro AI
                    </>
                  )}
                </button>
              </div>

              {/* JSON input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1d1d1f]">JSON výletu</label>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1 text-xs text-[#007aff] hover:text-[#0066d6] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Načíst ze souboru
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFile}
                  />
                </div>
                <textarea
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  placeholder='{ "title": "Název výletu", "startDate": "2025-07-01", … }'
                  rows={10}
                  className="w-full px-3 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow resize-y"
                  spellCheck={false}
                />
              </div>

              {error && (
                <div className="bg-[#fff2f2] border border-[#ffcdd2] text-[#c62828] text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-[#007aff] text-sm font-medium hover:bg-[#f0f6ff] rounded-xl transition-colors"
                >
                  Zrušit
                </button>
                <button
                  onClick={handleImport}
                  disabled={!json.trim() || loading}
                  className="px-4 py-2 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Importuji…" : "Importovat výlet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
