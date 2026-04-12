import Link from "next/link"
import Image from "next/image"

const TRIP_TYPE_LABELS: Record<string, string> = {
  roadtrip: "Roadtrip",
  trekking: "Trekking",
  město: "Město",
  dobrodružství: "Dobrodružství",
}

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
    country: string | null
    tripType: string | null
    year: number
  }
  isSelected?: boolean
}

function getDays(start: string, end: string): number {
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1
}

export default function TripCard({ trip, isSelected }: TripCardProps) {
  const days = getDays(trip.startDate, trip.endDate)
  const typeLabel = trip.tripType ? (TRIP_TYPE_LABELS[trip.tripType] ?? trip.tripType) : null

  return (
    <Link
      href={`/trips/${trip.slug}`}
      className={`group flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${
        isSelected
          ? "ring-2 ring-[#007aff] shadow-[0_8px_30px_rgba(0,122,255,0.15)]"
          : "shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
      }`}
    >
      {/* Photo — dominant */}
      <div className="relative aspect-[4/3] bg-[#f2f2f7] overflow-hidden flex-shrink-0">
        {trip.coverPhoto ? (
          <Image
            src={trip.coverPhoto}
            alt={trip.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-10 h-10 text-[#c7c7cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064" />
            </svg>
          </div>
        )}
        {/* Year badge */}
        <div className="absolute top-3 left-3 bg-black/50 text-white text-[11px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
          {trip.year}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Country + type pills */}
        {(trip.country || typeLabel) && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {trip.country && (
              <span className="text-[11px] text-[#6e6e73] bg-[#f2f2f7] px-2 py-0.5 rounded-full font-medium">
                {trip.country}
              </span>
            )}
            {typeLabel && (
              <span className="text-[11px] text-[#6e6e73] bg-[#f2f2f7] px-2 py-0.5 rounded-full">
                {typeLabel}
              </span>
            )}
          </div>
        )}

        <h2 className="font-semibold text-[#1d1d1f] text-base leading-snug mb-1 group-hover:text-[#007aff] transition-colors">
          {trip.title}
        </h2>

        <p className="text-[#8e8e93] text-xs mb-2">
          {days} {days === 1 ? "den" : days < 5 ? "dny" : "dní"}
          {trip.participants.length > 0 && ` · ${trip.participants.join(", ")}`}
        </p>

        {trip.description && (
          <p className="text-[#6e6e73] text-sm line-clamp-2 leading-relaxed flex-1">
            {trip.description}
          </p>
        )}
      </div>
    </Link>
  )
}
