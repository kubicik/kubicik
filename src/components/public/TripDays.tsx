"use client"

import { useState } from "react"
import Image from "next/image"
import type { Stop } from "@/types"

interface DayGroup {
  date: string // ISO date string
  stops: Stop[]
  dayIndex: number
}

function groupByDay(stops: Stop[]): DayGroup[] {
  const map = new Map<string, Stop[]>()
  for (const stop of stops) {
    const key = stop.date ? stop.date.slice(0, 10) : "unknown"
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(stop)
  }
  const entries = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  return entries.map(([date, dayStops], i) => ({ date, stops: dayStops, dayIndex: i + 1 }))
}

function formatDay(dateStr: string): string {
  if (dateStr === "unknown") return "Ostatní"
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

interface Props {
  stops: Stop[]
}

export default function TripDays({ stops }: Props) {
  const days = groupByDay(stops)
  const [openDay, setOpenDay] = useState<number | null>(0) // First day open by default

  return (
    <section className="py-16 bg-[#fafafa]">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-2">Den po dni</h2>
        <p className="text-[#6e6e73] text-base mb-10">
          Každý den trasy – zastávky, zážitky, fotky.
        </p>

        <div className="space-y-3">
          {days.map((day, i) => {
            const isOpen = openDay === i
            const stopsWithPhotos = day.stops.filter((s) => (s.photos?.length ?? 0) > 0)
            const allPhotos = stopsWithPhotos.flatMap((s) => s.photos ?? []).slice(0, 6)
            const mainStop = day.stops.find((s) => s.description) ?? day.stops[0]

            return (
              <div
                key={day.date}
                className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden"
              >
                {/* Header — always visible */}
                <button
                  onClick={() => setOpenDay(isOpen ? null : i)}
                  className="w-full px-6 py-5 flex items-start gap-4 text-left hover:bg-[#fafafa] transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1d1d1f] text-white text-sm font-semibold flex items-center justify-center mt-0.5">
                    {day.dayIndex}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-[#8e8e93] font-medium uppercase tracking-widest mb-0.5">
                          Den {day.dayIndex}
                        </p>
                        <h3 className="text-base font-semibold text-[#1d1d1f]">
                          {formatDay(day.date)}
                        </h3>
                      </div>
                      <svg
                        className={`w-5 h-5 text-[#8e8e93] flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <p className="text-sm text-[#6e6e73] mt-1.5">
                      {day.stops.map((s) => s.title).join(" → ")}
                    </p>
                    {/* Thumbnail strip preview when closed */}
                    {!isOpen && allPhotos.length > 0 && (
                      <div className="flex gap-1.5 mt-3">
                        {allPhotos.slice(0, 4).map((p) => (
                          <div
                            key={p.id}
                            className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#f2f2f7] flex-shrink-0"
                          >
                            <Image src={p.url} alt={p.caption ?? ""} fill className="object-cover" />
                          </div>
                        ))}
                        {allPhotos.length > 4 && (
                          <div className="w-12 h-12 rounded-lg bg-[#f2f2f7] flex items-center justify-center text-xs text-[#8e8e93] font-medium flex-shrink-0">
                            +{allPhotos.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t border-[#f2f2f7] px-6 py-6 space-y-8">
                    {day.stops.map((stop) => (
                      <div key={stop.id}>
                        <h4 className="text-base font-semibold text-[#1d1d1f] mb-1">
                          {stop.title}
                        </h4>
                        {stop.description && (
                          <p className="text-[#3a3a3c] text-sm leading-[1.8] mb-4 whitespace-pre-line">
                            {stop.description}
                          </p>
                        )}
                        {(stop.photos?.length ?? 0) > 0 && (
                          <div className={`grid gap-2 ${
                            stop.photos!.length === 1
                              ? "grid-cols-1"
                              : stop.photos!.length === 2
                              ? "grid-cols-2"
                              : "grid-cols-3"
                          }`}>
                            {stop.photos!.map((photo, pIdx) => (
                              <div
                                key={photo.id}
                                className={`relative overflow-hidden rounded-xl bg-[#f2f2f7] ${
                                  stop.photos!.length === 1
                                    ? "aspect-[16/9]"
                                    : stop.photos!.length >= 3 && pIdx === 0
                                    ? "col-span-2 aspect-[16/9]"
                                    : "aspect-square"
                                }`}
                              >
                                <Image
                                  src={photo.url}
                                  alt={photo.caption ?? stop.title}
                                  fill
                                  className="object-cover"
                                />
                                {photo.caption && (
                                  <p className="absolute bottom-0 left-0 right-0 text-xs text-white bg-black/40 px-3 py-1.5">
                                    {photo.caption}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
