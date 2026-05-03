import { prisma } from "@/lib/prisma"
import Link from "next/link"
import MatchListActions from "@/components/admin/MatchListActions"
import MatchImportExportButton from "@/components/admin/MatchImportExportButton"

function resultLabel(scoreSpurs: number, scoreOpponent: number) {
  if (scoreSpurs > scoreOpponent) return { label: "V", className: "bg-[#e8f8ed] text-[#1a7f37]" }
  if (scoreSpurs < scoreOpponent) return { label: "P", className: "bg-[#fff0f0] text-[#ff3b30]" }
  return { label: "R", className: "bg-[#f2f2f7] text-[#8e8e93]" }
}

export default async function AdminMatchesPage() {
  const matches = await prisma.match.findMany({ orderBy: { date: "desc" } })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">Zápasy Spurs</h1>
          <p className="text-[#8e8e93] text-sm mt-0.5">{matches.length} zápasů celkem</p>
        </div>
        <MatchImportExportButton />
        <Link
          href="/admin/matches/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nový zápas
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
        {matches.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[#8e8e93] text-sm">Zatím žádné zápasy</p>
            <Link href="/admin/matches/new" className="mt-3 inline-block text-[#007aff] text-sm hover:underline">
              Přidat první zápas
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#e5e5ea]">
            {matches.map((match, idx) => {
              const result = resultLabel(match.scoreSpurs, match.scoreOpponent)
              const attendees: string[] = (() => {
                try { return JSON.parse(match.attendees) } catch { return [] }
              })()
              return (
                <div key={match.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#f9f9f9] transition-colors">
                  <span className="flex-shrink-0 w-7 text-center text-xs font-semibold text-[#8e8e93]">
                    {matches.length - idx}
                  </span>
                  <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${result.className}`}>
                    {result.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-[#1d1d1f] text-sm">
                        {match.homeAway === "home" ? "Spurs" : match.opponent}
                        {" "}
                        <span className="font-bold">{match.scoreSpurs} – {match.scoreOpponent}</span>
                        {" "}
                        {match.homeAway === "home" ? match.opponent : "Spurs"}
                      </p>
                      <span className="text-xs px-2 py-0.5 bg-[#f2f2f7] text-[#6e6e73] rounded-full">
                        {match.competition}
                      </span>
                    </div>
                    <p className="text-[#8e8e93] text-xs mt-0.5">
                      {new Date(match.date).toLocaleDateString("cs-CZ", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                      {attendees.length > 0 && ` · ${attendees.join(", ")}`}
                      {match.videoUrl && " · 🎥"}
                    </p>
                  </div>
                  <MatchListActions matchId={match.id} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
