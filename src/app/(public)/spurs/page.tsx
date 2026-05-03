import { prisma } from "@/lib/prisma"
import MatchList from "@/components/public/MatchList"

export const revalidate = 60

export default async function SpursPage() {
  const matches = await prisma.match.findMany({ orderBy: { date: "desc" } })

  const serialized = matches.map((m) => ({
    ...m,
    date: m.date.toISOString(),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }))

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#132257] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight leading-none">Spurs na vlastní oči</h1>
          </div>
        </div>
        <p className="text-[#6e6e73] text-base ml-[52px]">
          Zápasy Tottenham Hotspur, na které jsme jako rodina dorazili živě.
        </p>
      </div>

      <MatchList matches={serialized} />
    </div>
  )
}
