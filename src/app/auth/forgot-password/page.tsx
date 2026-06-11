"use client"

import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    setLoading(false)
    if (res.ok) {
      setSent(true)
    } else {
      setError("Nepodařilo se odeslat email. Zkuste to znovu.")
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#007aff] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">Zapomenuté heslo</h1>
          <p className="text-[#8e8e93] text-sm mt-1">Pošleme vám odkaz pro obnovení hesla</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#e9f7ef] flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-[#1d1d1f]">
                Pokud email existuje v systému, pošleme vám odkaz pro obnovení hesla.
              </p>
              <Link href="/auth/signin" className="block text-sm text-[#007aff] hover:underline">
                Zpět na přihlášení
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-[#fff2f2] border border-[#ffcdd2] text-[#c62828] text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
                  placeholder="admin@kubicik.cz"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#007aff] text-white font-medium rounded-xl hover:bg-[#0066d6] transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? "Odesílám..." : "Odeslat odkaz"}
              </button>
              <div className="text-center">
                <Link href="/auth/signin" className="text-sm text-[#007aff] hover:underline">
                  Zpět na přihlášení
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
