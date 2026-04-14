"use client"

import { useEffect } from "react"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Admin error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.08)] p-8 text-center">
        <div className="w-12 h-12 bg-[#fff2f0] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-[#ff3b30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#1d1d1f] mb-2">Chyba při načítání stránky</h2>
        <p className="text-sm text-[#8e8e93] mb-1 font-mono break-all">{error.message}</p>
        {error.digest && (
          <p className="text-xs text-[#c7c7cc] mb-4">digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-4 px-5 py-2.5 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] transition-colors"
        >
          Zkusit znovu
        </button>
      </div>
    </div>
  )
}
