import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import TripMapGallery from "@/components/public/TripMapGallery"
import TripDays from "@/components/public/TripDays"
import TripTips from "@/components/public/TripTips"
import type { Stop, Photo } from "@/types"

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const trips = await prisma.trip.findMany({ where: { published: true }, select: { slug: true } })
    return trips.map((t) => ({ slug: t.slug }))
  } catch {
    return []
  }
}

function dateRange(start: Date, end: Date): string {
  const s = start.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })
  const e = end.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })
  return `${s} – ${e}`
}

function dayCount(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
}

const TRIP_TYPE_LABELS: Record<string, string> = {
  roadtrip: "Roadtrip",
  trekking: "Trekking",
  město: "Město",
  dobrodružství: "Dobrodružství",
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
    try { return JSON.parse(trip.participants) as string[] } catch { return [] }
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

  const days = dayCount(trip.startDate, trip.endDate)
  const typeLabel = trip.tripType ? (TRIP_TYPE_LABELS[trip.tripType] ?? trip.tripType) : null

  return (
    <article>
      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <header>
        {/* Cover photo */}
        {trip.coverPhoto ? (
          <div className="relative w-full aspect-[21/9] min-h-[280px] max-h-[600px] overflow-hidden bg-[#e5e5ea]">
            <Image
              src={trip.coverPhoto}
              alt={trip.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ) : (
          <div className="w-full aspect-[21/9] min-h-[280px] max-h-[400px] bg-[#e5e5ea]" />
        )}

        {/* Title block */}
        <div className="max-w-3xl mx-auto px-6 pt-10 pb-12">
          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-3 mb-5 text-xs font-medium text-[#6e6e73]">
            {trip.country && (
              <span>{trip.country}</span>
            )}
            {trip.country && (days || typeLabel) && (
              <span className="text-[#d1d1d6]">·</span>
            )}
            {days > 0 && (
              <span>{days} {days === 1 ? "den" : days < 5 ? "dny" : "dní"}</span>
            )}
            {days > 0 && typeLabel && (
              <span className="text-[#d1d1d6]">·</span>
            )}
            {typeLabel && (
              <span className="px-2 py-0.5 bg-[#f2f2f7] rounded-full">{typeLabel}</span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold text-[#1d1d1f] tracking-tight leading-[1.1] mb-4">
            {trip.title}
          </h1>

          <p className="text-sm text-[#8e8e93] mb-6">
            {dateRange(trip.startDate, trip.endDate)}
            {participants.length > 0 && (
              <> &nbsp;·&nbsp; {participants.join(", ")}</>
            )}
          </p>

          {trip.description && (
            <p className="text-lg text-[#3a3a3c] leading-[1.75] max-w-2xl">
              {trip.description}
            </p>
          )}
        </div>
      </header>

      {/* ─── THIN DIVIDER ─────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6">
        <hr className="border-[#e5e5ea]" />
      </div>

      {/* ─── MAP + GALLERY ────────────────────────────────────────── */}
      {stops.length > 0 && <TripMapGallery stops={stops} />}

      {/* ─── THIN DIVIDER ─────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6">
        <hr className="border-[#e5e5ea]" />
      </div>

      {/* ─── DAYS ─────────────────────────────────────────────────── */}
      {stops.length > 0 && <TripDays stops={stops} />}

      {/* ─── TIPS ─────────────────────────────────────────────────── */}
      {trip.tips && (
        <>
          <div className="max-w-3xl mx-auto px-6">
            <hr className="border-[#e5e5ea]" />
          </div>
          <TripTips tips={trip.tips} tripType={trip.tripType} />
        </>
      )}

      {/* ─── FOOTER SPACING ───────────────────────────────────────── */}
      <div className="h-16" />
    </article>
  )
}
