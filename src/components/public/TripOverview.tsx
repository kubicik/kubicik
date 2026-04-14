"use client"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import TripCard from "./TripCard"
import type { TripPin } from "./WorldMapInner"

const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false })

interface TripData {
  id: string
  slug: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  coverPhoto: string | null
  coverPhotoFocus: string | null
  participants: string[]
  stopCount: number
  country: string | null
  tripType: string | null
  year: number
  lat: number | null
  lng: number | null
}

interface Props {
  trips: TripData[]
}

export default function TripOverview({ trips }: Props) {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [filterCountry, setFilterCountry] = useState<string | null>(null)
  const [filterYear, setFilterYear] = useState<number | null>(null)
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map())
  const pendingScrollId = useRef<string | null>(null)

  // Map pins — only trips with coordinates
  const pins: TripPin[] = useMemo(
    () =>
      trips.flatMap((t) =>
        t.lat !== null && t.lng !== null
          ? [{ id: t.id, slug: t.slug, title: t.title, year: t.year, country: t.country, lat: t.lat!, lng: t.lng! }]
          : []
      ),
    [trips]
  )

  // Filter options
  const countries = useMemo(
    () => [...new Set(trips.map((t) => t.country).filter(Boolean) as string[])].sort(),
    [trips]
  )
  const years = useMemo(
    () => [...new Set(trips.map((t) => t.year))].sort((a, b) => b - a),
    [trips]
  )

  // Filtered list — selected trip is always shown
  const filtered = useMemo(
    () =>
      trips.filter((t) => {
        if (t.id === selectedTripId) return true
        if (filterCountry && t.country !== filterCountry) return false
        if (filterYear && t.year !== filterYear) return false
        return true
      }),
    [trips, filterCountry, filterYear, selectedTripId]
  )

  // Scroll to card after render when a pin is clicked
  useEffect(() => {
    if (!pendingScrollId.current) return
    const id = pendingScrollId.current
    pendingScrollId.current = null
    const el = cardRefs.current.get(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" })
  })

  const handlePinClick = useCallback((trip: TripPin) => {
    setSelectedTripId(trip.id)
    pendingScrollId.current = trip.id
  }, [])

  const toggleCountry = (c: string) => setFilterCountry((prev) => (prev === c ? null : c))
  const toggleYear = (y: number) => setFilterYear((prev) => (prev === y ? null : y))

  return (
    <div>
      {/* World map */}
      {pins.length > 0 && (
        <div
          className="w-full mb-10 rounded-2xl overflow-hidden border border-[#e5e5ea]"
          style={{ height: 380 }}
        >
          <WorldMap trips={pins} selectedTripId={selectedTripId} onTripClick={handlePinClick} />
        </div>
      )}

      {/* Filter pills */}
      {(countries.length > 1 || years.length > 1) && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {countries.length > 1 && (
            <>
              <button
                onClick={() => setFilterCountry(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !filterCountry
                    ? "bg-[#1d1d1f] text-white"
                    : "bg-[#f2f2f7] text-[#3a3a3c] hover:bg-[#e5e5ea]"
                }`}
              >
                Vše
              </button>
              {countries.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCountry(c)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filterCountry === c
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#f2f2f7] text-[#3a3a3c] hover:bg-[#e5e5ea]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </>
          )}

          {years.length > 1 && (
            <div
              className={`flex flex-wrap gap-2 ${countries.length > 1 ? "pl-2 border-l border-[#e5e5ea] ml-1" : ""}`}
            >
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => toggleYear(y)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filterYear === y
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#f2f2f7] text-[#3a3a3c] hover:bg-[#e5e5ea]"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cards grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((trip) => (
            <div
              key={trip.id}
              ref={(el) => {
                if (el) cardRefs.current.set(trip.id, el)
                else cardRefs.current.delete(trip.id)
              }}
            >
              <TripCard trip={trip} isSelected={trip.id === selectedTripId} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[#8e8e93]">
          Žádné výlety neodpovídají filtru.
        </div>
      )}
    </div>
  )
}
