"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import type { Photo } from "@/types"

interface Props {
  photos: Photo[]
  index: number
  onClose: () => void
  onChange: (index: number) => void
}

export default function Lightbox({ photos, index, onClose, onChange }: Props) {
  const photo = photos[index]
  const hasPrev = index > 0
  const hasNext = index < photos.length - 1
  const touchStartX = useRef<number | null>(null)

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft" && hasPrev) onChange(index - 1)
      else if (e.key === "ArrowRight" && hasNext) onChange(index + 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [index, hasPrev, hasNext, onClose, onChange])

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  if (!photo) return null

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (delta > 60 && hasPrev) onChange(index - 1)
    else if (delta < -60 && hasNext) onChange(index + 1)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-12 flex-shrink-0">
        <div className="w-10" />
        <span className="text-white/50 text-sm tabular-nums">
          {index + 1} / {photos.length}
        </span>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Zavřít"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Image — click on dark area closes, click on image does nothing */}
      <div className="flex-1 min-h-0 relative cursor-zoom-out" onClick={onClose}>
        <div
          className="absolute inset-0 flex items-center justify-center px-14 sm:px-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full h-full cursor-default">
            <Image
              key={photo.id}
              src={photo.url}
              alt={photo.caption ?? ""}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      </div>

      {/* Bottom bar: prev / caption / next */}
      <div className="flex items-center gap-3 px-3 h-14 flex-shrink-0">
        <button
          onClick={() => hasPrev && onChange(index - 1)}
          disabled={!hasPrev}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-white/60 disabled:text-white/20 hover:text-white rounded-full hover:bg-white/10 disabled:cursor-default transition-colors"
          aria-label="Předchozí"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <p className="flex-1 text-white/50 text-xs text-center line-clamp-2 min-w-0">
          {photo.caption ?? ""}
        </p>

        <button
          onClick={() => hasNext && onChange(index + 1)}
          disabled={!hasNext}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-white/60 disabled:text-white/20 hover:text-white rounded-full hover:bg-white/10 disabled:cursor-default transition-colors"
          aria-label="Další"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
