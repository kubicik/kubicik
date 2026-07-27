"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface TripRef { id: string; slug: string; title: string; startDate: string; published: boolean }
interface MatchRef { id: string; opponent: string; competition: string; date: string; scoreSpurs: number; scoreOpponent: number; homeAway: string }
interface PersonDetail { id: string; name: string; trips: TripRef[]; matches: MatchRef[] }
interface PersonRef { id: string; name: string }

export default function AdminPersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [person, setPerson] = useState<PersonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [others, setOthers] = useState<PersonRef[]>([])
  const [mergeTarget, setMergeTarget] = useState("")
  const [merging, setMerging] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/persons/${id}`)
    if (res.status === 404) { setNotFound(true); setLoading(false); return }
    const data = await res.json()
    setPerson(data)
    setName(data.name)
    setLoading(false)
  }
  useEffect(() => { load() }, [id])

  useEffect(() => {
    fetch("/api/persons").then((r) => r.json()).then((list: PersonRef[]) => setOthers(list.filter((p) => p.id !== id))).catch(() => {})
  }, [id])

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name.trim() === person?.name) return
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/persons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || "Přejmenování se nezdařilo")
      return
    }
    load()
  }

  async function handleMerge() {
    if (!mergeTarget) return
    setMerging(true)
    setError(null)
    // Merge THIS person into the chosen target, then land on the target's detail.
    const res = await fetch("/api/persons/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceIds: [id], targetId: mergeTarget }),
    })
    setMerging(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || "Sloučení se nezdařilo")
      return
    }
    router.push(`/admin/persons/${mergeTarget}`)
  }

  async function handleDelete() {
    await fetch(`/api/persons/${id}`, { method: "DELETE" })
    router.push("/admin/persons")
  }

  if (loading) return <div className="px-6 py-12 text-center text-[#8e8e93] text-sm">Načítám…</div>
  if (notFound || !person) return (
    <div>
      <Link href="/admin/persons" className="text-sm text-[#007aff] hover:underline">← Účastníci</Link>
      <p className="mt-6 text-[#8e8e93]">Osoba nenalezena.</p>
    </div>
  )

  const totalCount = person.trips.length + person.matches.length

  return (
    <div className="max-w-3xl">
      <Link href="/admin/persons" className="text-sm text-[#007aff] hover:underline">← Účastníci</Link>

      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">{person.name}</h1>
        <p className="text-[#8e8e93] text-sm mt-0.5">
          {totalCount === 0 ? "Zatím bez výskytu" : `Vyskytuje se ve ${person.trips.length} výletech a ${person.matches.length} zápasech`}
        </p>
      </div>

      {/* Rename */}
      <form onSubmit={handleRename} className="bg-white rounded-2xl border border-[#e5e5ea] p-5 mb-6">
        <label className="block text-sm font-medium text-[#1d1d1f] mb-2">Jméno</label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null) }}
            className="flex-1 px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
          />
          <button
            type="submit"
            disabled={saving || !name.trim() || name.trim() === person.name}
            className="px-4 py-2 text-sm bg-[#007aff] text-white font-medium rounded-xl hover:bg-[#0066d6] disabled:opacity-50 transition-colors"
          >
            {saving ? "Ukládám…" : "Přejmenovat"}
          </button>
        </div>
        <p className="text-xs text-[#8e8e93] mt-2">Změna jména se propíše do všech výletů a zápasů, kde osoba vystupuje.</p>
        {error && <p className="text-sm text-[#ff3b30] mt-2">{error}</p>}
      </form>

      {/* Occurrences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#e5e5ea] font-medium text-sm text-[#1d1d1f]">
            Výlety ({person.trips.length})
          </div>
          {person.trips.length === 0 ? (
            <div className="px-5 py-6 text-center text-[#8e8e93] text-sm">Žádné</div>
          ) : (
            <div className="divide-y divide-[#e5e5ea]">
              {person.trips.map((t) => (
                <Link key={t.id} href={`/admin/trips/${t.id}`} className="flex items-center gap-2 px-5 py-3 hover:bg-[#f9f9f9] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1d1d1f] truncate">{t.title}</p>
                    <p className="text-xs text-[#8e8e93]">{new Date(t.startDate).toLocaleDateString("cs-CZ")}{!t.published && " · koncept"}</p>
                  </div>
                  <svg className="w-4 h-4 text-[#c7c7cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#e5e5ea] font-medium text-sm text-[#1d1d1f]">
            Zápasy ({person.matches.length})
          </div>
          {person.matches.length === 0 ? (
            <div className="px-5 py-6 text-center text-[#8e8e93] text-sm">Žádné</div>
          ) : (
            <div className="divide-y divide-[#e5e5ea]">
              {person.matches.map((m) => (
                <Link key={m.id} href={`/admin/matches/${m.id}`} className="flex items-center gap-2 px-5 py-3 hover:bg-[#f9f9f9] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1d1d1f] truncate">
                      {m.homeAway === "home" ? `Spurs – ${m.opponent}` : `${m.opponent} – Spurs`}
                    </p>
                    <p className="text-xs text-[#8e8e93]">{new Date(m.date).toLocaleDateString("cs-CZ")} · {m.competition}</p>
                  </div>
                  <svg className="w-4 h-4 text-[#c7c7cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Merge */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5 mb-6">
        <p className="text-sm font-medium text-[#1d1d1f] mb-1">Sloučit do jiné osoby</p>
        <p className="text-xs text-[#8e8e93] mb-3">Všechny výskyty této osoby se převedou pod vybranou osobu a tento záznam se smaže. Nelze vrátit.</p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={mergeTarget}
            onChange={(e) => setMergeTarget(e.target.value)}
            className="px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl bg-white focus:outline-none focus:border-[#007aff]"
          >
            <option value="">— vyber cílovou osobu —</option>
            {others.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button
            onClick={handleMerge}
            disabled={!mergeTarget || merging}
            className="px-4 py-2 text-sm bg-[#f2f2f7] text-[#3a3a3c] font-medium rounded-xl hover:bg-[#e5e5ea] disabled:opacity-50 transition-colors"
          >
            {merging ? "Slučuji…" : "Sloučit"}
          </button>
        </div>
      </div>

      {/* Delete */}
      <div className="bg-white rounded-2xl border border-[#ffd5d2] p-5">
        <p className="text-sm font-medium text-[#1d1d1f] mb-1">Smazat osobu</p>
        <p className="text-xs text-[#8e8e93] mb-3">Odebere osobu ze všech výletů a zápasů. Nelze vrátit.</p>
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <button onClick={handleDelete} className="px-4 py-2 text-sm bg-[#ff3b30] text-white font-medium rounded-xl hover:bg-[#d63029] transition-colors">
              Opravdu smazat
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-sm text-[#6e6e73] hover:text-[#1d1d1f]">Zrušit</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="px-4 py-2 text-sm text-[#ff3b30] border border-[#ffd5d2] rounded-xl hover:bg-[#fff5f5] transition-colors">
            Smazat
          </button>
        )}
      </div>
    </div>
  )
}
