"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import type { Stop, Photo } from "@/types"

const TripMapGalleryInner = dynamic(() => import("./TripMapGalleryInner"), { ssr: false })

interface Props {
  stops: Stop[]
}

export default function TripMapGallery({ stops: allStops }: Props) {
  const stopsWithPhotos = useMemo(
    () => allStops.filter((s) => (s.photos?.length ?? 0) > 0),
    [allStops]
  )
  const firstWithPhotos = stopsWithPhotos[0] ?? allStops[0] ?? null
  const [selectedStopId, setSelectedStopId] = useState<string | null>(
    firstWithPhotos?.id ?? null
  )

  const selectedStop = allStops.find((s) => s.id === selectedStopId) ?? null
  const photos = selectedStop?.photos ?? []

  function handleStopSelect(stop: Stop) {
    setSelectedStopId(stop.id)
  }

  function handlePhotoClick(photo: Photo) {
    // Find which stop owns this photo and select it
    const owner = allStops.find((s) => s.photos?.some((p) => p.id === photo.id))
    if (owner) setSelectedStopId(owner.id)
  }

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-2">Mapa trasy</h2>
        <p className="text-[#6e6e73] text-base mb-8">
          Klikni na zastávku pro zobrazení fotek z daného místa.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-0 rounded-2xl overflow-hidden border border-[#e5e5ea] lg:h-[560px]">
          {/* Map */}
          <div className="h-[420px] lg:h-full bg-[#f5f5f7]">
            <TripMapGalleryInner
              stops={allStops}
              selectedStopId={selectedStopId}
              onStopSelect={handleStopSelect}
            />
          </div>

          {/* Gallery panel — fixed height so photos scroll instead of expanding the block */}
          <div className="h-[400px] lg:h-full bg-white border-t lg:border-t-0 lg:border-l border-[#e5e5ea] flex flex-col">
            {selectedStop ? (
              <>
                {/* Stop header */}
                <div className="px-6 pt-6 pb-4 border-b border-[#f2f2f7]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#8e8e93] uppercase tracking-widest">
                      {selectedStop.date
                        ? new Date(selectedStop.date).toLocaleDateString("cs-CZ", {
                            day: "numeric",
                            month: "long",
                          })
                        : "Zastávka"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#1d1d1f] leading-snug">
                    {selectedStop.title}
                  </h3>
                  {selectedStop.description && (
                    <p className="text-sm text-[#6e6e73] mt-2 leading-relaxed line-clamp-3">
                      {selectedStop.description}
                    </p>
                  )}
                </div>

                {/* Photos — show first 3, 4th slot shows "+N dalších" if more exist */}
                <div className="flex-1 overflow-y-auto p-4">
                  {photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {photos.slice(0, 3).map((photo) => (
                        <button
                          key={photo.id}
                          onClick={() => handlePhotoClick(photo)}
                          className="relative aspect-square overflow-hidden rounded-lg bg-[#f2f2f7] group"
                        >
                          <Image
                            src={photo.url}
                            alt={photo.caption ?? selectedStop.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {photo.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {photo.caption}
                            </div>
                          )}
                        </button>
                      ))}
                      {photos.length > 3 && (
                        <div className="relative aspect-square overflow-hidden rounded-lg">
                          <Image
                            src={photos[3].url}
                            alt=""
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/62 flex flex-col items-center justify-center gap-1">
                            <span className="text-white text-3xl font-bold leading-none">+{photos.length - 3}</span>
                            <span className="text-white/75 text-xs tracking-wide">dalších</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-[#8e8e93] text-sm">
                      Žádné fotky
                    </div>
                  )}
                </div>

                {/* Navigation: prev / next stop with photos */}
                {stopsWithPhotos.length > 1 && (
                  <div className="px-4 py-3 border-t border-[#f2f2f7] flex items-center justify-between">
                    <button
                      onClick={() => {
                        const idx = stopsWithPhotos.findIndex((s) => s.id === selectedStopId)
                        const prev = stopsWithPhotos[idx - 1]
                        if (prev) setSelectedStopId(prev.id)
                      }}
                      disabled={stopsWithPhotos.findIndex((s) => s.id === selectedStopId) === 0}
                      className="text-sm text-[#007aff] disabled:text-[#c7c7cc] transition-colors"
                    >
                      ← Předchozí
                    </button>
                    <span className="text-xs text-[#8e8e93]">
                      {stopsWithPhotos.findIndex((s) => s.id === selectedStopId) + 1} / {stopsWithPhotos.length}
                    </span>
                    <button
                      onClick={() => {
                        const idx = stopsWithPhotos.findIndex((s) => s.id === selectedStopId)
                        const next = stopsWithPhotos[idx + 1]
                        if (next) setSelectedStopId(next.id)
                      }}
                      disabled={
                        stopsWithPhotos.findIndex((s) => s.id === selectedStopId) ===
                        stopsWithPhotos.length - 1
                      }
                      className="text-sm text-[#007aff] disabled:text-[#c7c7cc] transition-colors"
                    >
                      Další →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center flex-1 text-[#8e8e93] text-sm p-8 text-center">
                Klikni na zastávku na mapě
              </div>
            )}
          </div>
        </div>

        {/* Stop list pills below map */}
        <div className="mt-4 flex flex-wrap gap-2">
          {allStops.map((stop, idx) => (
            <button
              key={stop.id}
              onClick={() => handleStopSelect(stop)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-colors ${
                selectedStopId === stop.id
                  ? "bg-[#1d1d1f] text-white"
                  : "bg-[#f2f2f7] text-[#3a3a3c] hover:bg-[#e5e5ea]"
              }`}
            >
              <span className={`text-xs font-semibold ${selectedStopId === stop.id ? "text-white/60" : "text-[#8e8e93]"}`}>
                {idx + 1}
              </span>
              {stop.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
