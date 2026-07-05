"use client"

import { useState, useEffect } from "react"
import type { FamilyChild } from "@/types"

const PALETTE = [
  "#007aff", "#34c759", "#ff9500", "#ff3b30", "#af52de",
  "#5ac8fa", "#ff2d55", "#00c7be", "#ffcc00", "#636366",
]

interface ChildFormProps {
  initial?: FamilyChild
  onSave: (data: { name: string; color: string; order: number }) => Promise<void>
  onCancel: () => void
  nextOrder: number
}

function ChildForm({ initial, onSave, onCancel, nextOrder }: ChildFormProps) {
  const [name, setName] = useState(initial?.name ?? "")
  const [color, setColor] = useState(initial?.color ?? PALETTE[0])
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave({ name: name.trim(), color, order: initial?.order ?? nextOrder })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#f9f5f0] rounded-xl p-4 space-y-3">
      <div>
        <label className="block text-xs font-medium text-[#8e8e93] mb-1">Jméno dítěte</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="např. Eliška, Tomáš..."
          className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#8e8e93] mb-1.5">Barva</label>
        <div className="flex gap-2 flex-wrap">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                outline: color === c ? `2px solid ${c}` : "none",
                outlineOffset: "2px",
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-[#8e8e93] hover:bg-white rounded-lg transition-colors">
          Zrušit
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="px-4 py-1.5 bg-[#007aff] text-white text-sm font-medium rounded-lg hover:bg-[#0066d6] disabled:opacity-50 transition-colors"
        >
          {saving ? "Ukládám..." : "Uložit"}
        </button>
      </div>
    </div>
  )
}

function CredentialsForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/family/credentials")
      .then((r) => r.json())
      .then((d) => d?.username && setCurrentUsername(d.username))
      .catch(() => null)
  }, [])

  async function handleSave() {
    if (password && password !== confirm) {
      setMessage({ type: "err", text: "Hesla se neshodují" })
      return
    }
    if (!username.trim() && !password.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/family/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username || undefined, password: password || undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        setMessage({ type: "err", text: err.error ?? "Chyba" })
      } else {
        const updated = await res.json()
        setCurrentUsername(updated.username)
        setUsername("")
        setPassword("")
        setConfirm("")
        setMessage({ type: "ok", text: "Uloženo" })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-8 bg-white rounded-2xl border border-[#e5e5ea] p-5">
      <h3 className="text-sm font-semibold text-[#1d1d1f] mb-1">Přihlašovací údaje rodinné sekce</h3>
      {currentUsername && (
        <p className="text-xs text-[#8e8e93] mb-4">
          Aktuální jméno: <code className="bg-[#f2f2f7] px-1.5 py-0.5 rounded font-mono text-[#1d1d1f]">{currentUsername}</code>
        </p>
      )}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#8e8e93] mb-1">Nové uživatelské jméno (volitelné)</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ponechat beze změny"
            className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8e8e93] mb-1">Nové heslo (volitelné)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ponechat beze změny"
            className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
          />
        </div>
        {password && (
          <div>
            <label className="block text-xs font-medium text-[#8e8e93] mb-1">Potvrdit heslo</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Zopakujte heslo"
              className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
            />
          </div>
        )}
        {message && (
          <p className={`text-xs ${message.type === "ok" ? "text-[#34c759]" : "text-[#ff3b30]"}`}>
            {message.text}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={saving || (!username.trim() && !password.trim())}
          className="px-4 py-2 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] disabled:opacity-50 transition-colors"
        >
          {saving ? "Ukládám..." : "Uložit přihlašovací údaje"}
        </button>
      </div>
    </div>
  )
}

interface Props {
  initialChildren: FamilyChild[]
}

export default function ChildrenSettings({ initialChildren }: Props) {
  const [children, setChildren] = useState<FamilyChild[]>(initialChildren)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleAdd(data: { name: string; color: string; order: number }) {
    const res = await fetch("/api/family/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const child = await res.json()
    setChildren((prev) => [...prev, child])
    setAdding(false)
  }

  async function handleEdit(id: string, data: { name: string; color: string; order: number }) {
    const res = await fetch(`/api/family/children/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const updated = await res.json()
    setChildren((prev) => prev.map((c) => (c.id === id ? updated : c)))
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/family/children/${id}`, { method: "DELETE" })
      setChildren((prev) => prev.filter((c) => c.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="max-w-md">
      <div className="bg-white rounded-2xl border border-[#e5e5ea] divide-y divide-[#e5e5ea] mb-4">
        {children.length === 0 && !adding && (
          <div className="px-6 py-10 text-center">
            <p className="text-[#8e8e93] text-sm">Zatím žádné děti. Přidejte první.</p>
          </div>
        )}

        {children.map((child) => (
          <div key={child.id}>
            {editingId === child.id ? (
              <div className="p-4">
                <ChildForm
                  initial={child}
                  onSave={(data) => handleEdit(child.id, data)}
                  onCancel={() => setEditingId(null)}
                  nextOrder={children.length}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: child.color + "25" }}>
                  <span className="text-base font-semibold" style={{ color: child.color }}>
                    {child.name[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1d1d1f]">{child.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: child.color }} />
                    <span className="text-xs text-[#8e8e93]">{child.color}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingId(child.id)}
                    className="p-1.5 text-[#8e8e93] hover:text-[#007aff] hover:bg-[#f0f6ff] rounded-lg transition-colors"
                    title="Upravit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(child.id)}
                    disabled={deleting === child.id}
                    className="p-1.5 text-[#8e8e93] hover:text-[#ff3b30] hover:bg-[#fff2f0] rounded-lg transition-colors disabled:opacity-50"
                    title="Smazat"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding && (
          <div className="p-4">
            <ChildForm
              onSave={handleAdd}
              onCancel={() => setAdding(false)}
              nextOrder={children.length}
            />
          </div>
        )}
      </div>

      {!adding && !editingId && children.length < 8 && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e5ea] text-[#007aff] text-sm font-medium rounded-xl hover:bg-[#f0f6ff] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Přidat dítě
        </button>
      )}

      <CredentialsForm />
    </div>
  )
}
