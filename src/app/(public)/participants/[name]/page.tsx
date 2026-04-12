import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import TripCard from "@/components/public/TripCard"

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const trips = await prisma.trip.findMany({ where: { published: true }, select: { participants: true } })
    const names = new Set<string>()
    for (const trip of trips) {
      try {
        const parsed = JSON.parse(trip.participants) as string[]
        parsed.forEach((n) => names.add(n))
      } catch { /* skip */ }
    }
    return [...names].map((name) => ({ name: encodeURIComponent(name) }))
  } catch {
    return []
  }
}

export default async function ParticipantPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: encodedName } = await params
  const name = decodeURIComponent(encodedName)

  // Find trips where participants JSON contains this exact name
  const allTrips = await prisma.trip.findMany({
    where: {
      published: true,
      participants: { contains: `"${name}"` },
    },
    orderBy: { startDate: "desc" },
    include: {
      _count: { select: { stops: true } },
    },
  })

  // Double-check: filter to exact match (the LIKE query may over-match substrings in theory)
  const trips = allTrips.filter((trip) => {
    try {
      return (JSON.parse(trip.participants) as string[]).includes(name)
    } catch {
      return false
    }
  })

  if (trips.length === 0) notFound()

  const tripData = trips.map((trip) => {
    const participants = (() => {
      try { return JSON.parse(trip.participants) as string[] }
      catch { return [] }
    })()
    return {
      id: trip.id,
      slug: trip.slug,
      title: trip.title,
      description: trip.description,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      coverPhoto: trip.coverPhoto,
      participants,
      stopCount: trip._count.stops,
      country: trip.country,
      tripType: trip.tripType,
      year: trip.startDate.getFullYear(),
      lat: null,
      lng: null,
    }
  })

  const total = trips.length

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-[#8e8e93] text-sm mb-1">
          <a href="/participants" className="hover:text-[#1d1d1f] transition-colors">Účastníci</a>
          {" / "}
          <span className="text-[#1d1d1f]">{name}</span>
        </p>
        <h1 className="text-4xl font-semibold text-[#1d1d1f] tracking-tight mb-2">{name}</h1>
        <p className="text-[#6e6e73] text-lg">
          {total} {total === 1 ? "výlet" : total < 5 ? "výlety" : "výletů"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tripData.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </div>
  )
}
