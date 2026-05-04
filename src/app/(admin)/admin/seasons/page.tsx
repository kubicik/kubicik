"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Season { id: string; name: string; matchCount: number }

export default function AdminSeasonsPage() {
  const router = useRouter()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [newName, setNewName] = useState("")
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  async function load() {
    const res = await fetch("/api/seasons")
    setSeasons(await res.json())
  }
  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    await fetch("/api/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setNewName("")
    setSaving(false)
    load()
  }

  async function handleEdit(id: string) {
    if (!editName.trim()) return
    setSaving(true)
    await fetch(`/api/seasons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    })
    setEditId(null)
    setEditName("")
    setSaving(false)
    load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/seasons/${id}`, { method: "DELETE" })
    setConfirmDelete(null)
    load()
    router.refresh()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Sezóny</h1>
        <p className="text-[#8e8e93] text-sm mt-0.5">Číselník sezón Tottenham Hotspur</p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-[#e5e5ea] p-5 mb-6 flex items-center gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="např. 2024/25"
          className="flex-1 px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
        />
        <button
          type="submit"
          disabled={saving || !newName.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Přidat sezónu
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
        {seasons.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#8e8e93] text-sm">Zatím žádné sezóny</div>
        ) : (
          <div className="divide-y divide-[#e5e5ea]">
            {seasons.map((season) => (
              <div key={season.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#f9f9f9] transition-colors">
                {editId === season.id ? (
                  <>
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleEdit(season.id); if (e.key === "Escape") setEditId(null) }}
                      className="flex-1 px-3 py-1.5 text-sm border border-[#007aff] rounded-xl focus:outline-none"
                    />
                    <button onClick={() => handleEdit(season.id)} disabled={saving} className="text-sm text-[#007aff] hover:underline">Uložit</button>
                    <button onClick={() => setEditId(null)} className="text-sm text-[#6e6e73] hover:text-[#1d1d1f]">Zrušit</button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="font-medium text-[#1d1d1f]">{season.name}</p>
                      <p className="text-xs text-[#8e8e93] mt-0.5">{season.matchCount} {season.matchCount === 1 ? "zápas" : season.matchCount < 5 ? "zápasy" : "zápasů"}</p>
                    </div>
                    <button onClick={() => { setEditId(season.id); setEditName(season.name) }} className="text-sm text-[#007aff] hover:underline">Přejmenovat</button>
                    {confirmDelete === season.id ? (
                      <>
                        <button onClick={() => handleDelete(season.id)} className="text-xs text-white bg-[#ff3b30] px-3 py-1 rounded-lg hover:bg-[#d63029]">Smazat</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs text-[#6e6e73]">Zrušit</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDelete(season.id)} className="text-sm text-[#ff3b30] hover:underline">Smazat</button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
