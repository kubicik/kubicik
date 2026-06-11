"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("Hesla se neshodují"); return }
    if (password.length < 6) { setError("Heslo musí mít alespoň 6 znaků"); return }

    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      router.push("/auth/signin?reset=1")
    } else {
      setError(data.error ?? "Nepodařilo se obnovit heslo")
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-[#ff3b30]">Neplatný nebo chybějící token.</p>
        <Link href="/auth/forgot-password" className="text-sm text-[#007aff] hover:underline">
          Požádat o nový odkaz
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-[#fff2f2] border border-[#ffcdd2] text-[#c62828] text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Nové heslo</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
          placeholder="Alespoň 6 znaků"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Potvrdit heslo</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
          placeholder="Zopakujte heslo"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-[#007aff] text-white font-medium rounded-xl hover:bg-[#0066d6] transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? "Ukládám..." : "Nastavit nové heslo"}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#007aff] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">Nové heslo</h1>
          <p className="text-[#8e8e93] text-sm mt-1">Zadejte nové heslo pro svůj účet</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <Suspense fallback={<div className="text-center text-sm text-[#8e8e93]">Načítám…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
