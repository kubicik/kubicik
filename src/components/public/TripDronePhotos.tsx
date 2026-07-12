"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import type { TripPhoto, Photo } from "@/types"
import Lightbox from "./Lightbox"

export default function TripDronePhotos({ photos }: { photos: TripPhoto[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const open = useCallback((i: number) => setLightboxIndex(i), [])
  const close = useCallback(() => setLightboxIndex(null), [])

  if (!photos.length) return null

  // Map to the shape Lightbox needs
  const lbPhotos: Photo[] = photos.map((p) => ({
    id: p.id,
    stopId: "",
    url: p.url,
    caption: p.caption,
    order: p.order,
    createdAt: p.createdAt,
  }))

  return (
    <>
      <section className="w-full bg-[#0c0c10] py-10 sm:py-14">
        {/* Section label */}
        <div className="flex items-center gap-3 px-5 sm:px-10 mb-6 sm:mb-8">
          <svg className="w-4 h-4 text-white/25 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span className="text-[10px] tracking-[0.25em] uppercase text-white/30 font-semibold">
            Z ptačí perspektivy
          </span>
          <span className="text-[10px] text-white/15 ml-auto tabular-nums">
            {photos.length} {photos.length === 1 ? "záběr" : photos.length < 5 ? "záběry" : "záběrů"}
          </span>
        </div>

        {/* Photo grid — auto-fill, expands to use full monitor width */}
        <div
          className="px-4 sm:px-8"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
            gap: "6px",
          }}
        >
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              className="relative overflow-hidden rounded-lg group cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              style={{ aspectRatio: "3/2" }}
              onClick={() => open(i)}
              aria-label={photo.caption ?? `Záběr ${i + 1}`}
            >
              <Image
                src={photo.url}
                alt={photo.caption ?? "Dronový záběr"}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300" />
              {/* Zoom hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
              {/* Caption slide-up */}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                  <p className="text-white text-xs leading-snug">{photo.caption}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {lightboxIndex !== null && (
        <Lightbox
          photos={lbPhotos}
          index={lightboxIndex}
          onClose={close}
          onChange={setLightboxIndex}
        />
      )}
    </>
  )
}
