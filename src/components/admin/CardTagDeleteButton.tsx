"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  id: string
  name: string
}

export default function CardTagDeleteButton({ id, name }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/card-tags/${id}`, { method: "DELETE" })
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#8e8e93]">Smazat „{name}"?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1 text-xs font-medium bg-[#ff3b30] text-white rounded-lg hover:bg-[#d63025] disabled:opacity-50"
        >
          {deleting ? "..." : "Ano"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1 text-xs font-medium bg-[#f2f2f7] text-[#3c3c43] rounded-lg hover:bg-[#e5e5ea]"
        >
          Ne
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-2 text-[#8e8e93] hover:text-[#ff3b30] hover:bg-[#fff2f0] rounded-xl transition-colors"
      title="Smazat štítek"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}
