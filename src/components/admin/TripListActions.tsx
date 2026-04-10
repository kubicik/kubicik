"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

export default function TripListActions({ tripId }: { tripId: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm("Opravdu smazat tento výlet? Budou smazány i všechny zastávky a fotografie.")) return
    await fetch(`/api/trips/${tripId}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <Link
        href={`/admin/trips/${tripId}/stops`}
        className="p-2 text-[#8e8e93] hover:text-[#007aff] hover:bg-[#f0f6ff] rounded-lg transition-colors"
        title="Spravovat zastávky"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      </Link>
      <Link
        href={`/admin/trips/${tripId}`}
        className="p-2 text-[#8e8e93] hover:text-[#007aff] hover:bg-[#f0f6ff] rounded-lg transition-colors"
        title="Upravit výlet"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </Link>
      <button
        onClick={handleDelete}
        className="p-2 text-[#8e8e93] hover:text-[#ff3b30] hover:bg-[#fff2f0] rounded-lg transition-colors"
        title="Smazat výlet"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}
