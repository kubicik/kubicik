"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function MatchListActions({ matchId }: { matchId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/matches/${matchId}`, { method: "DELETE" })
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-white bg-[#ff3b30] px-3 py-1 rounded-lg hover:bg-[#d63029] disabled:opacity-50 transition-colors"
        >
          {deleting ? "Mažu…" : "Smazat"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
        >
          Zrušit
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/admin/matches/${matchId}`}
        className="text-sm text-[#007aff] hover:underline"
      >
        Upravit
      </Link>
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-[#ff3b30] hover:underline"
      >
        Smazat
      </button>
    </div>
  )
}
