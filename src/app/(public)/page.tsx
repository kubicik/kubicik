import { prisma } from "@/lib/prisma"
import TripCard from "@/components/public/TripCard"

export const revalidate = 60

export default async function HomePage() {
  const trips = await prisma.trip.findMany({
    where: { published: true },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { stops: true } } },
  })

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold text-[#1d1d1f] tracking-tight mb-3">
          Naše cesty
        </h1>
        <p className="text-[#6e6e73] text-lg">
          Záznamy z našich cestovatelských výletů po světě
        </p>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-20 text-[#8e8e93]">
          <svg className="w-16 h-16 text-[#c7c7cc] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064" />
          </svg>
          <p>Zatím žádné výlety</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const participants = (() => {
              try { return JSON.parse(trip.participants) as string[] }
              catch { return [] }
            })()
            return (
              <TripCard
                key={trip.id}
                trip={{
                  id: trip.id,
                  slug: trip.slug,
                  title: trip.title,
                  description: trip.description,
                  startDate: trip.startDate.toISOString(),
                  endDate: trip.endDate.toISOString(),
                  coverPhoto: trip.coverPhoto,
                  participants,
                  stopCount: trip._count.stops,
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
