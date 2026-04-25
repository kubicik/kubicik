import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import StopEditor from "@/components/admin/StopEditor"
import Link from "next/link"
import type { Stop, Photo } from "@/types"

export default async function ManageStopsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let trip
  try {
    trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        stops: {
          orderBy: { order: "asc" },
          include: { photos: { orderBy: { order: "asc" } } },
        },
      },
    })
  } catch (err) {
    throw new Error(
      `Nepodařilo se načíst výlet z databáze: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  if (!trip) notFound()

  // Serialize for client component
  const stops: Stop[] = trip.stops.map((s) => ({
    id: s.id,
    tripId: s.tripId,
    title: s.title,
    description: s.description,
    date: s.date ? s.date.toISOString() : null,
    lat: s.lat,
    lng: s.lng,
    order: s.order,
    tags: s.tags,
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
    <div className="h-full">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/admin/trips/${id}`} className="text-[#8e8e93] hover:text-[#1d1d1f] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">Zastávky na mapě</h1>
          <p className="text-[#8e8e93] text-sm mt-0.5">{trip.title}</p>
        </div>
      </div>

      <StopEditor tripId={id} initialStops={stops} />
    </div>
  )
}
