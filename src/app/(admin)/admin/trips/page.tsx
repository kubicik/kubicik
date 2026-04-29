import { prisma } from "@/lib/prisma"
import Link from "next/link"
import TripListActions from "@/components/admin/TripListActions"
import TripImportButton from "@/components/admin/TripImportButton"

export default async function AdminTripsPage() {
  const trips = await prisma.trip.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { stops: true } } },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">Výlety</h1>
          <p className="text-[#8e8e93] text-sm mt-0.5">{trips.length} výletů celkem</p>
        </div>
        <div className="flex items-center gap-2">
          <TripImportButton />
          <Link
            href="/admin/trips/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nový výlet
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
        {trips.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <svg className="w-12 h-12 text-[#c7c7cc] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064" />
            </svg>
            <p className="text-[#8e8e93] text-sm">Zatím žádné výlety</p>
            <Link href="/admin/trips/new" className="mt-3 inline-block text-[#007aff] text-sm hover:underline">
              Přidat první výlet
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#e5e5ea]">
            {trips.map((trip) => {
              const participants = (() => {
                try { return JSON.parse(trip.participants) as string[] }
                catch { return [] }
              })()
              return (
                <div key={trip.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#f9f9f9] transition-colors">
                  {trip.coverPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={trip.coverPhoto} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#f2f2f7] flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-[#c7c7cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#1d1d1f] text-sm truncate">{trip.title}</p>
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                        trip.published ? "bg-[#e8f8ed] text-[#1a7f37]" : "bg-[#f2f2f7] text-[#8e8e93]"
                      }`}>
                        {trip.published ? "Publikováno" : "Koncept"}
                      </span>
                    </div>
                    <p className="text-[#8e8e93] text-xs mt-0.5">
                      {new Date(trip.startDate).toLocaleDateString("cs-CZ")} – {new Date(trip.endDate).toLocaleDateString("cs-CZ")}
                      {participants.length > 0 && ` · ${participants.join(", ")}`}
                      {` · ${trip._count.stops} zastávek`}
                    </p>
                  </div>
                  <TripListActions tripId={trip.id} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
