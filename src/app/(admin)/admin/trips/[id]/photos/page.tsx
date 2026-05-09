import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import TripPhotoManager from "@/components/admin/TripPhotoManager"
import type { TripPhoto } from "@/types"

export default async function TripPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let trip
  try {
    trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        stops: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true } },
        tripPhotos: { orderBy: { createdAt: "asc" } },
      },
    })
  } catch (err) {
    throw new Error(
      `Nepodařilo se načíst výlet: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  if (!trip) notFound()

  const photos: TripPhoto[] = trip.tripPhotos.map((p) => ({
    id: p.id,
    tripId: p.tripId,
    stopId: p.stopId,
    isDrone: p.isDrone,
    url: p.url,
    caption: p.caption,
    order: p.order,
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        <Link
          href={`/admin/trips/${id}`}
          className="text-[#8e8e93] hover:text-[#1d1d1f] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">Fotky výletu</h1>
          <p className="text-[#8e8e93] text-sm mt-0.5">{trip.title}</p>
        </div>
      </div>

      <TripPhotoManager
        tripId={id}
        stops={trip.stops}
        initialPhotos={photos}
      />
    </div>
  )
}
