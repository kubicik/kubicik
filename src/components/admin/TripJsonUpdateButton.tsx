"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

interface PreviewData {
  toCreate: number
  toUpdate: number
  toDelete: number
  deletedStopTitles: string[]
}

interface Props {
  tripId: string
}

export default function TripJsonUpdateButton({ tripId }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"input" | "preview">("input")
  const [json, setJson] = useState("")
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [error, setError] = useState("")
  const [fetching, setFetching] = useState(false)   // loading current JSON
  const [previewing, setPreviewing] = useState(false) // loading preview
  const [updating, setUpdating] = useState(false)    // executing update
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadCurrentJson() {
    setFetching(true)
    setError("")
    try {
      const res = await fetch(`/api/trips/${tripId}/export`)
      if (!res.ok) throw new Error("Nepodařilo se načíst")
      setJson(await res.text())
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
    setStep("input")
    setJson("")
    setPreview(null)
    setError("")
  }

  async function handlePreview() {
    setError("")
    let data
    try { data = JSON.parse(json) } catch { setError("Neplatný JSON — zkontrolujte formát"); return }
    setPreviewing(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/update-from-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, preview: true }),
      })
      const result = await res.json()
      if (!res.ok) { setError(result.error || "Chyba při načítání rekapitulace"); return }
      setPreview(result)
      setStep("preview")
    } catch (err) {
      setError(`Chyba: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setPreviewing(false)
    }
  }

  async function handleUpdate() {
    setError("")
    let data
    try { data = JSON.parse(json) } catch { setError("Neplatný JSON"); return }
    setUpdating(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/update-from-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, preview: false }),
      })
      const result = await res.json()
      if (!res.ok) { setError(result.error || "Chyba při aktualizaci"); return }
      handleClose()
      router.push(`/admin/trips/${tripId}/stops`)
    } catch (err) {
      setError(`Chyba: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUpdating(false)
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
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5ea]">
              <div className="flex items-center gap-2">
                {step === "preview" && (
                  <button
                    onClick={() => { setStep("input"); setPreview(null); setError("") }}
                    className="w-7 h-7 flex items-center justify-center text-[#8e8e93] hover:text-[#1d1d1f] hover:bg-[#f2f2f7] rounded-full transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <div>
                  <h2 className="font-semibold text-[#1d1d1f]">
                    {step === "input" ? "Aktualizovat výlet z JSON" : "Rekapitulace změn"}
                  </h2>
                  <p className="text-xs text-[#8e8e93] mt-0.5">
                    {step === "input"
                      ? "Zastávky se shodným ID budou aktualizovány, ostatní přidány nebo smazány."
                      : "Zkontrolujte změny před potvrzením."}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center text-[#8e8e93] hover:text-[#1d1d1f] hover:bg-[#f2f2f7] rounded-full transition-colors ml-2 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* ── Step 1: JSON input ── */}
              {step === "input" && (
                <>
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
                          {fetching ? "Načítám…" : (
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
                        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
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

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button onClick={handleClose} className="px-4 py-2 text-[#007aff] text-sm font-medium hover:bg-[#f0f6ff] rounded-xl transition-colors">
                      Zrušit
                    </button>
                    <button
                      onClick={handlePreview}
                      disabled={!json.trim() || previewing}
                      className="flex items-center gap-2 px-4 py-2 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {previewing ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Načítám…
                        </>
                      ) : (
                        <>
                          Zkontrolovat změny
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* ── Step 2: Preview / confirmation ── */}
              {step === "preview" && preview && (
                <>
                  {/* Metadata note */}
                  <div className="flex items-start gap-2.5 px-4 py-3 bg-[#f2f2f7] rounded-xl text-sm text-[#3a3a3c]">
                    <svg className="w-4 h-4 text-[#8e8e93] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Metadata výletu (název, popis, termín, účastníci…) budou aktualizována.
                  </div>

                  {/* Stop diff stats */}
                  <div>
                    <p className="text-xs font-semibold text-[#8e8e93] uppercase tracking-wide mb-2">Zastávky</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center px-3 py-3 bg-[#f0f6ff] rounded-xl">
                        <span className="text-2xl font-bold text-[#007aff]">{preview.toUpdate}</span>
                        <span className="text-xs text-[#007aff] mt-0.5">aktualizováno</span>
                      </div>
                      <div className="flex flex-col items-center px-3 py-3 bg-[#f0fff4] rounded-xl">
                        <span className="text-2xl font-bold text-[#1a7f37]">{preview.toCreate}</span>
                        <span className="text-xs text-[#1a7f37] mt-0.5">přidáno</span>
                      </div>
                      <div className={`flex flex-col items-center px-3 py-3 rounded-xl ${preview.toDelete > 0 ? "bg-[#fff2f0]" : "bg-[#f2f2f7]"}`}>
                        <span className={`text-2xl font-bold ${preview.toDelete > 0 ? "text-[#ff3b30]" : "text-[#c7c7cc]"}`}>{preview.toDelete}</span>
                        <span className={`text-xs mt-0.5 ${preview.toDelete > 0 ? "text-[#ff3b30]" : "text-[#c7c7cc]"}`}>smazáno</span>
                      </div>
                    </div>
                  </div>

                  {/* Deletion warning with names */}
                  {preview.toDelete > 0 && (
                    <div className="bg-[#fff2f0] border border-[#ffcdd2] rounded-xl px-4 py-3 space-y-1.5">
                      <p className="text-xs font-semibold text-[#c62828] flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        Tyto zastávky budou smazány včetně fotografií:
                      </p>
                      <ul className="space-y-0.5">
                        {preview.deletedStopTitles.map((title, i) => (
                          <li key={i} className="text-xs text-[#c62828] flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#ff3b30] flex-shrink-0" />
                            {title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {error && (
                    <div className="bg-[#fff2f2] border border-[#ffcdd2] text-[#c62828] text-sm px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      onClick={() => { setStep("input"); setPreview(null); setError("") }}
                      className="px-4 py-2 text-[#007aff] text-sm font-medium hover:bg-[#f0f6ff] rounded-xl transition-colors"
                    >
                      ← Zpět
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={updating}
                      className="flex items-center gap-2 px-4 py-2 bg-[#ff9500] text-white text-sm font-medium rounded-xl hover:bg-[#e08600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Aktualizuji…
                        </>
                      ) : "Potvrdit aktualizaci"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
