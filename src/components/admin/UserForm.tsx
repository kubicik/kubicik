"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  initial?: {
    id: string
    username: string
    name: string
    role: string
  }
}

export default function UserForm({ initial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [username, setUsername] = useState(initial?.username ?? "")
  const [name, setName] = useState(initial?.name ?? "")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState(initial?.role ?? "admin")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const payload: Record<string, string> = { name, role }
    if (!initial) {
      payload.username = username
      payload.password = password
    } else if (password) {
      payload.password = password
    }

    const url = initial ? `/api/users/${initial.id}` : "/api/users"
    const method = initial ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Chyba při ukládání")
      return
    }

    router.push("/admin/users")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-[#fff2f2] border border-[#ffcdd2] text-[#c62828] text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 space-y-4">
        <h2 className="text-sm font-medium text-[#8e8e93] uppercase tracking-wide">
          Informace o uživateli
        </h2>

        {!initial && (
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Uživatelské jméno *</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="jannovak"
              className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Jméno *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Jan Novák"
            className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
            Heslo {initial ? "(nechte prázdné pro zachování)" : "*"}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!initial}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
          >
            <option value="admin">admin</option>
            <option value="viewer">viewer</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-[#007aff] text-sm font-medium hover:bg-[#f0f6ff] rounded-xl transition-colors"
        >
          Zrušit
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] transition-colors disabled:opacity-50"
        >
          {loading ? "Ukládám..." : initial ? "Uložit změny" : "Vytvořit uživatele"}
        </button>
      </div>
    </form>
  )
}
