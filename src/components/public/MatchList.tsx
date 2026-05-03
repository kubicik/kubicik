"use client"

import { useState } from "react"
import type { Match } from "@/types"

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // youtube.com/watch?v=ID
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`
    }
    // youtu.be/ID
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`
    }
    return url
  } catch {
    return null
  }
}

function resultInfo(scoreSpurs: number, scoreOpponent: number) {
  if (scoreSpurs > scoreOpponent) return { label: "V", bg: "bg-green-500", text: "Výhra" }
  if (scoreSpurs < scoreOpponent) return { label: "P", bg: "bg-[#ff3b30]", text: "Prohra" }
  return { label: "R", bg: "bg-[#8e8e93]", text: "Remíza" }
}

const COMPETITION_COLORS: Record<string, string> = {
  "Premier League":         "bg-[#3d195b] text-white",
  "Champions League":       "bg-[#001f5b] text-white",
  "Europa League":          "bg-[#f47b20] text-white",
  "UEFA Conference League": "bg-[#0d3c6e] text-white",
  "FA Cup":                 "bg-[#002147] text-white",
  "EFL Cup":                "bg-[#008080] text-white",
  "Přátelský zápas":        "bg-[#8e8e93] text-white",
}

interface MatchCardProps {
  match: Match
  index: number
}

function MatchCard({ match, index }: MatchCardProps) {
  const [videoOpen, setVideoOpen] = useState(false)
  const result = resultInfo(match.scoreSpurs, match.scoreOpponent)
  const attendees: string[] = (() => { try { return JSON.parse(match.attendees) } catch { return [] } })()
  const compClass = COMPETITION_COLORS[match.competition] ?? "bg-[#f2f2f7] text-[#3a3a3c]"
  const embedUrl = match.videoUrl ? getEmbedUrl(match.videoUrl) : null

  const dateStr = new Date(match.date).toLocaleDateString("cs-CZ", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  })
  const timeStr = new Date(match.date).toLocaleTimeString("cs-CZ", {
    hour: "2-digit", minute: "2-digit",
  })

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
      <div className="px-5 py-5">
        {/* Top row: number + competition + date */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#132257] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {index}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${compClass}`}>
              {match.competition}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#8e8e93]">{dateStr}</p>
            <p className="text-xs text-[#c7c7cc]">{timeStr}</p>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#8e8e93] uppercase tracking-wide mb-1">
              {match.homeAway === "home" ? "Domácí" : "Hosté"}
            </p>
            <p className="text-base font-semibold text-[#1d1d1f]">
              {match.homeAway === "home" ? "Tottenham Hotspur" : match.opponent}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-[#1d1d1f] tabular-nums">
                {match.homeAway === "home" ? match.scoreSpurs : match.scoreOpponent}
              </span>
              <span className="text-xl text-[#8e8e93]">–</span>
              <span className="text-3xl font-bold text-[#1d1d1f] tabular-nums">
                {match.homeAway === "home" ? match.scoreOpponent : match.scoreSpurs}
              </span>
            </div>
            <span className={`text-xs font-bold text-white px-2.5 py-0.5 rounded-full ${result.bg}`}>
              {result.text}
            </span>
          </div>

          <div className="flex-1 text-right">
            <p className="text-xs font-semibold text-[#8e8e93] uppercase tracking-wide mb-1">
              {match.homeAway === "away" ? "Domácí" : "Hosté"}
            </p>
            <p className="text-base font-semibold text-[#1d1d1f]">
              {match.homeAway === "home" ? match.opponent : "Tottenham Hotspur"}
            </p>
          </div>
        </div>

        {/* Venue */}
        {match.venue && (
          <p className="text-xs text-[#8e8e93] mb-3 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {match.venue}
          </p>
        )}

        {/* Attendees */}
        {attendees.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {attendees.map((a) => (
              <span key={a} className="text-xs px-2.5 py-0.5 bg-[#132257]/10 text-[#132257] rounded-full font-medium">
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Notes */}
        {match.notes && (
          <p className="text-sm text-[#6e6e73] leading-relaxed mt-2">{match.notes}</p>
        )}

        {/* Video toggle */}
        {embedUrl && (
          <button
            onClick={() => setVideoOpen(!videoOpen)}
            className="mt-3 flex items-center gap-2 text-xs text-[#007aff] hover:text-[#0066d6] transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {videoOpen ? "Skrýt video" : "Zobrazit video"}
          </button>
        )}
      </div>

      {/* Video embed */}
      {embedUrl && videoOpen && (
        <div className="aspect-video w-full border-t border-[#f2f2f7]">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  )
}

interface Props {
  matches: Match[]
}

export default function MatchList({ matches }: Props) {
  const wins = matches.filter((m) => m.scoreSpurs > m.scoreOpponent).length
  const draws = matches.filter((m) => m.scoreSpurs === m.scoreOpponent).length
  const losses = matches.filter((m) => m.scoreSpurs < m.scoreOpponent).length
  const goalsFor = matches.reduce((s, m) => s + m.scoreSpurs, 0)
  const goalsAgainst = matches.reduce((s, m) => s + m.scoreOpponent, 0)

  return (
    <div>
      {/* Stats */}
      {matches.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
          {[
            { label: "Celkem", value: matches.length, cls: "text-[#1d1d1f]" },
            { label: "Výhry", value: wins, cls: "text-green-600" },
            { label: "Remízy", value: draws, cls: "text-[#8e8e93]" },
            { label: "Prohry", value: losses, cls: "text-[#ff3b30]" },
            { label: "Skóre", value: `${goalsFor}:${goalsAgainst}`, cls: "text-[#1d1d1f]" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#e5e5ea] px-4 py-4 text-center">
              <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
              <p className="text-xs text-[#8e8e93] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Match cards — sorted desc (newest first), display number = asc order */}
      <div className="space-y-4">
        {matches.map((match, i) => (
          <MatchCard key={match.id} match={match} index={matches.length - i} />
        ))}
      </div>

      {matches.length === 0 && (
        <div className="text-center py-20 text-[#8e8e93] text-sm">
          Zatím žádné zápasy nezaznamenány.
        </div>
      )}
    </div>
  )
}
