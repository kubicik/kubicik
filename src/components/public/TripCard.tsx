import Link from "next/link"
import Image from "next/image"

interface TripCardProps {
  trip: {
    id: string
    slug: string
    title: string
    description: string | null
    startDate: string
    endDate: string
    coverPhoto: string | null
    participants: string[]
    stopCount: number
  }
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" }
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })} – ${e.getDate()}.`
  }
  return `${s.toLocaleDateString("cs-CZ", opts)} – ${e.toLocaleDateString("cs-CZ", opts)}`
}

function getDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  return `${days} dní`
}

export default function TripCard({ trip }: TripCardProps) {
  return (
    <Link
      href={`/trips/${trip.slug}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 flex flex-col"
    >
      {/* Cover image */}
      <div className="relative h-48 bg-[#f2f2f7] overflow-hidden">
        {trip.coverPhoto ? (
          <Image
            src={trip.coverPhoto}
            alt={trip.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-12 h-12 text-[#c7c7cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064" />
            </svg>
          </div>
        )}
        {/* Duration badge */}
        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">
          {getDuration(trip.startDate, trip.endDate)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h2 className="font-semibold text-[#1d1d1f] text-base mb-1 group-hover:text-[#007aff] transition-colors">
          {trip.title}
        </h2>
        <p className="text-[#8e8e93] text-xs mb-2">
          {formatDateRange(trip.startDate, trip.endDate)}
        </p>
        {trip.description && (
          <p className="text-[#6e6e73] text-sm line-clamp-2 mb-3 flex-1">{trip.description}</p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#e5e5ea]">
          {trip.participants.length > 0 && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#8e8e93]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[#8e8e93] text-xs">{trip.participants.join(", ")}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[#8e8e93] text-xs ml-auto">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {trip.stopCount} zastávek
          </div>
        </div>
      </div>
    </Link>
  )
}
