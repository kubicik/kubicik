import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import TripDetailMap from "@/components/public/TripDetailMap"
import type { Stop, Photo } from "@/types"

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const trips = await prisma.trip.findMany({ where: { published: true }, select: { slug: true } })
    return trips.map((t) => ({ slug: t.slug }))
  } catch {
    // DB may not exist yet at build time (first deploy before migrate)
    return []
  }
}

function formatDate(d: string | null): string {
  if (!d) return ""
  return new Date(d).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const fmtFull: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }
  return `${s.toLocaleDateString("cs-CZ", fmtFull)} – ${e.toLocaleDateString("cs-CZ", fmtFull)}`
}

export default async function TripDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const trip = await prisma.trip.findFirst({
    where: { slug, published: true },
    include: {
      stops: {
        orderBy: { order: "asc" },
        include: { photos: { orderBy: { order: "asc" } } },
      },
    },
  })
  if (!trip) notFound()

  const participants = (() => {
    try { return JSON.parse(trip.participants) as string[] }
    catch { return [] }
  })()

  const stops: Stop[] = trip.stops.map((s) => ({
    id: s.id,
    tripId: s.tripId,
    title: s.title,
    description: s.description,
    date: s.date ? s.date.toISOString() : null,
    lat: s.lat,
    lng: s.lng,
    order: s.order,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    photos: s.photos.map((p): Photo => ({
      id: p.id,
      stopId: p.stopId,
      url: p.url,
      caption: p.caption,
      order: p.order,
      createdAt: p.createdAt.toISOString(),
    })),
  }))

  return (
    <div>
      {/* Hero */}
      <div className="relative h-64 sm:h-80 bg-[#f2f2f7] overflow-hidden">
        {trip.coverPhoto ? (
          <Image src={trip.coverPhoto} alt={trip.title} fill className="object-cover" priority />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#007aff]/10 to-[#5ac8fa]/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-6 pb-6">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-1">
            {trip.title}
          </h1>
          <p className="text-white/80 text-sm">
            {formatDateRange(trip.startDate.toISOString(), trip.endDate.toISOString())}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Meta row */}
        <div className="flex flex-wrap gap-4 mb-8 pb-6 border-b border-[#e5e5ea]">
          {trip.description && (
            <p className="text-[#6e6e73] text-base w-full">{trip.description}</p>
          )}
          {participants.length > 0 && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#8e8e93]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[#6e6e73] text-sm">{participants.join(", ")}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#8e8e93]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[#6e6e73] text-sm">{stops.length} zastávek</span>
          </div>
        </div>

        {stops.length > 0 && (
          <div className="space-y-8">
            {/* Map */}
            <div className="rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.08)] h-80">
              <TripDetailMap stops={stops} />
            </div>

            {/* Stops */}
            <div className="space-y-8">
              {stops.map((stop, idx) => (
                <div key={stop.id} className="flex gap-4">
                  {/* Number */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-[#007aff] text-white text-sm font-semibold flex items-center justify-center">
                      {idx + 1}
                    </div>
                    {idx < stops.length - 1 && (
                      <div className="w-px flex-1 bg-[#e5e5ea] mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-[#1d1d1f]">{stop.title}</h3>
                      {stop.date && (
                        <p className="text-[#8e8e93] text-sm mt-0.5">{formatDate(stop.date)}</p>
                      )}
                    </div>
                    {stop.description && (
                      <p className="text-[#6e6e73] text-sm mb-4 leading-relaxed">{stop.description}</p>
                    )}

                    {/* Photos */}
                    {(stop.photos?.length ?? 0) > 0 && (
                      <div className={`grid gap-2 ${
                        stop.photos!.length === 1 ? "grid-cols-1" :
                        stop.photos!.length === 2 ? "grid-cols-2" :
                        "grid-cols-3"
                      }`}>
                        {stop.photos!.map((photo, pIdx) => (
                          <div
                            key={photo.id}
                            className={`relative overflow-hidden rounded-xl bg-[#f2f2f7] ${
                              stop.photos!.length === 1 ? "aspect-video" :
                              stop.photos!.length >= 3 && pIdx === 0 ? "col-span-2 aspect-video" :
                              "aspect-square"
                            }`}
                          >
                            <Image
                              src={photo.url}
                              alt={photo.caption ?? stop.title}
                              fill
                              className="object-cover hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
