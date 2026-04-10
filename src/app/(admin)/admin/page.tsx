import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function AdminDashboard() {
  const [tripCount, userCount, publishedCount] = await Promise.all([
    prisma.trip.count(),
    prisma.user.count(),
    prisma.trip.count({ where: { published: true } }),
  ])

  const recentTrips = await prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const stats = [
    { label: "Celkem výletů", value: tripCount, href: "/admin/trips" },
    { label: "Publikováno", value: publishedCount, href: "/admin/trips" },
    { label: "Uživatelé", value: userCount, href: "/admin/users" },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">Přehled</h1>
          <p className="text-[#8e8e93] text-sm mt-0.5">Správa cestovatelských výletů</p>
        </div>
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-shadow"
          >
            <p className="text-3xl font-semibold text-[#1d1d1f]">{s.value}</p>
            <p className="text-[#8e8e93] text-sm mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent trips */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
          <h2 className="font-semibold text-[#1d1d1f]">Poslední výlety</h2>
          <Link href="/admin/trips" className="text-[#007aff] text-sm hover:underline">
            Zobrazit vše
          </Link>
        </div>
        {recentTrips.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#8e8e93] text-sm">
            Zatím žádné výlety. <Link href="/admin/trips/new" className="text-[#007aff] hover:underline">Přidat první výlet</Link>
          </div>
        ) : (
          <div className="divide-y divide-[#e5e5ea]">
            {recentTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/admin/trips/${trip.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-[#f9f9f9] transition-colors"
              >
                <div>
                  <p className="font-medium text-[#1d1d1f] text-sm">{trip.title}</p>
                  <p className="text-[#8e8e93] text-xs mt-0.5">
                    {new Date(trip.startDate).toLocaleDateString("cs-CZ")} – {new Date(trip.endDate).toLocaleDateString("cs-CZ")}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  trip.published
                    ? "bg-[#e8f8ed] text-[#1a7f37]"
                    : "bg-[#f2f2f7] text-[#8e8e93]"
                }`}>
                  {trip.published ? "Publikováno" : "Koncept"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
