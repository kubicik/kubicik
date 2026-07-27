"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Person {
  id: string
  name: string
  tripCount: number
  matchCount: number
  total: number
}

function plural(n: number, one: string, few: string, many: string) {
  return n === 1 ? one : n >= 2 && n <= 4 ? few : many
}

export default function AdminPersonsPage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  // Merge mode
  const [mergeMode, setMergeMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [targetId, setTargetId] = useState<string | null>(null)
  const [merging, setMerging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/persons")
    setPersons(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = persons.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setError(null)
  }

  function cancelMerge() {
    setMergeMode(false)
    setSelected(new Set())
    setTargetId(null)
    setError(null)
  }

  async function handleMerge() {
    if (!targetId || selected.size < 2) return
    const sourceIds = [...selected].filter((id) => id !== targetId)
    if (sourceIds.length === 0) return
    setMerging(true)
    setError(null)
    const res = await fetch("/api/persons/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceIds, targetId }),
    })
    setMerging(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || "Sloučení se nezdařilo")
      return
    }
    cancelMerge()
    load()
  }

  const selectedPersons = persons.filter((p) => selected.has(p.id))

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">Účastníci</h1>
          <p className="text-[#8e8e93] text-sm mt-0.5">Jednotný číselník osob z výletů a Spurs zápasů</p>
        </div>
        {!mergeMode ? (
          <button
            onClick={() => setMergeMode(true)}
            disabled={persons.length < 2}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-[#f2f2f7] text-[#3a3a3c] text-sm font-medium rounded-xl hover:bg-[#e5e5ea] disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 8l3-3M7 8l3 3m7 5H7m10 0l-3-3m3 3l-3 3" />
            </svg>
            Sloučit osoby
          </button>
        ) : (
          <button onClick={cancelMerge} className="flex-shrink-0 px-4 py-2 text-sm text-[#6e6e73] hover:text-[#1d1d1f]">
            Zrušit slučování
          </button>
        )}
      </div>

      {mergeMode && (
        <div className="bg-[#fff9e6] border border-[#ffe08a] rounded-2xl p-5 mb-6">
          <p className="text-sm text-[#8a6d00] mb-3">
            Zaškrtni <strong>dvě a více</strong> osob, které jsou ve skutečnosti stejný člověk, a vyber pod jakým jménem je sloučit.
            Všechny výskyty se přepíšou. <strong>Tuto akci nelze vrátit.</strong>
          </p>
          {selectedPersons.length >= 2 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-[#8a6d00]">Sloučit pod jménem:</span>
              <select
                value={targetId ?? ""}
                onChange={(e) => setTargetId(e.target.value || null)}
                className="px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl bg-white focus:outline-none focus:border-[#007aff]"
              >
                <option value="">— vyber —</option>
                {selectedPersons.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={handleMerge}
                disabled={!targetId || merging}
                className="px-4 py-2 text-sm bg-[#007aff] text-white font-medium rounded-xl hover:bg-[#0066d6] disabled:opacity-50 transition-colors"
              >
                {merging ? "Slučuji…" : `Sloučit ${selectedPersons.length} osob`}
              </button>
            </div>
          )}
          {error && <p className="text-sm text-[#ff3b30] mt-3">{error}</p>}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hledat osobu…"
          className="w-full max-w-xs px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-[#8e8e93] text-sm">Načítám…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#8e8e93] text-sm">
            {persons.length === 0 ? "Zatím žádní účastníci" : "Nic nenalezeno"}
          </div>
        ) : (
          <div className="divide-y divide-[#e5e5ea]">
            {filtered.map((p) => {
              const row = (
                <div className="flex items-center gap-4 px-6 py-4 hover:bg-[#f9f9f9] transition-colors">
                  {mergeMode && (
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="w-4 h-4 accent-[#007aff]"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1d1d1f] truncate">{p.name}</p>
                    <p className="text-xs text-[#8e8e93] mt-0.5">
                      {p.tripCount > 0 && `${p.tripCount} ${plural(p.tripCount, "výlet", "výlety", "výletů")}`}
                      {p.tripCount > 0 && p.matchCount > 0 && " · "}
                      {p.matchCount > 0 && `${p.matchCount} ${plural(p.matchCount, "zápas", "zápasy", "zápasů")}`}
                      {p.total === 0 && "bez výskytu"}
                    </p>
                  </div>
                  {!mergeMode && (
                    <svg className="w-5 h-5 text-[#c7c7cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              )
              return mergeMode ? (
                <div key={p.id} className="cursor-pointer" onClick={() => toggleSelect(p.id)}>{row}</div>
              ) : (
                <Link key={p.id} href={`/admin/persons/${p.id}`} className="block">{row}</Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
