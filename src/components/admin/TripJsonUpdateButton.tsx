"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

interface Props {
  tripId: string
}

export default function TripJsonUpdateButton({ tripId }: Props) {
  const [open, setOpen] = useState(false)
  const [json, setJson] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadCurrentJson() {
    setFetching(true)
    setError("")
    try {
      const res = await fetch(`/api/trips/${tripId}/export`)
      if (!res.ok) throw new Error("Nepodařilo se načíst")
      const text = await res.text()
      setJson(text)
    } catch (err) {
      setError(`Nepodařilo se načíst aktuální JSON: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setFetching(false)
    }
  }

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

  async function handleUpdate() {
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
      const res = await fetch(`/api/trips/${tripId}/update-from-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || "Chyba při aktualizaci")
        return
      }
      handleClose()
      router.push(`/admin/trips/${tripId}/stops`)
    } catch (err) {
      setError(`Chyba: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#1d1d1f] text-sm font-medium rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:bg-[#f9f9f9] border border-[#e5e5ea] transition-colors"
      >
        <svg className="w-4 h-4 text-[#8e8e93]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Aktualizovat z JSON
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5ea]">
              <div>
                <h2 className="font-semibold text-[#1d1d1f]">Aktualizovat výlet z JSON</h2>
                <p className="text-xs text-[#8e8e93] mt-0.5">Zastávky budou nahrazeny těmi z JSON. Fotky zastávek se zachovají jen pokud jsou v JSON.</p>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center text-[#8e8e93] hover:text-[#1d1d1f] hover:bg-[#f2f2f7] rounded-full transition-colors ml-4 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1d1d1f]">JSON výletu</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={loadCurrentJson}
                      disabled={fetching}
                      className="flex items-center gap-1 text-xs text-[#007aff] hover:text-[#0066d6] disabled:opacity-50 transition-colors"
                    >
                      {fetching ? (
                        <span>Načítám…</span>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Načíst aktuální
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1 text-xs text-[#007aff] hover:text-[#0066d6] transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Ze souboru
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={handleFile}
                    />
                  </div>
                </div>
                <textarea
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  placeholder='{ "title": "Název výletu", "startDate": "2025-07-01", … }'
                  rows={14}
                  className="w-full px-3 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow resize-y"
                  spellCheck={false}
                />
              </div>

              {error && (
                <div className="bg-[#fff2f2] border border-[#ffcdd2] text-[#c62828] text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="bg-[#fff8e6] border border-[#ffe082] text-[#7a5800] text-xs px-4 py-3 rounded-xl">
                Tato akce přepíše metadata výletu a <strong>smaže všechny stávající zastávky</strong> včetně fotografií, které nejsou v JSON.
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-[#007aff] text-sm font-medium hover:bg-[#f0f6ff] rounded-xl transition-colors"
                >
                  Zrušit
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={!json.trim() || loading}
                  className="px-4 py-2 bg-[#ff9500] text-white text-sm font-medium rounded-xl hover:bg-[#e08600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Aktualizuji…" : "Aktualizovat výlet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
