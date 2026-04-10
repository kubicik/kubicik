import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import TripForm from "@/components/admin/TripForm"
import Link from "next/link"

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const trip = await prisma.trip.findUnique({ where: { id } })
  if (!trip) notFound()

  const participants = (() => {
    try { return JSON.parse(trip.participants) as string[] }
    catch { return [] }
  })()

  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        <Link href="/admin/trips" className="text-[#8e8e93] hover:text-[#1d1d1f] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">Upravit výlet</h1>
          <p className="text-[#8e8e93] text-sm mt-0.5">{trip.title}</p>
        </div>
      </div>

      <div className="mb-6">
        <Link
          href={`/admin/trips/${id}/stops`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#007aff] text-sm font-medium rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:bg-[#f0f6ff] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Spravovat zastávky na mapě
        </Link>
      </div>

      <TripForm
        initial={{
          id: trip.id,
          title: trip.title,
          description: trip.description ?? "",
          startDate: trip.startDate.toISOString(),
          endDate: trip.endDate.toISOString(),
          coverPhoto: trip.coverPhoto ?? "",
          participants,
          published: trip.published,
        }}
      />
    </div>
  )
}
