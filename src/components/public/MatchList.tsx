"use client"

import { useState } from "react"
import Image from "next/image"
import type { Match, MatchPhoto } from "@/types"
import Lightbox from "./Lightbox"

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`
    }
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

function PhotoGallery({ photos }: { photos: MatchPhoto[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  if (photos.length === 0) return null

  const lightboxPhotos = photos.map((p) => ({
    id: p.id,
    stopId: p.matchId,
    url: p.url,
    caption: p.caption,
    order: p.order,
    createdAt: p.createdAt,
  }))

  const cols = photos.length === 1 ? 1 : photos.length === 2 ? 2 : 3
  const visible = photos.slice(0, cols)

  return (
    <>
      <div className={`grid gap-1.5 mt-4 ${cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {visible.map((photo, i) => {
          const isLast = i === cols - 1 && photos.length > cols
          return (
            <button
              key={photo.id}
              onClick={() => setLightboxIndex(i)}
              className={`relative overflow-hidden rounded-xl bg-[#f2f2f7] cursor-zoom-in ${cols === 1 ? "aspect-[16/9]" : "aspect-square"}`}
            >
              <Image src={photo.url} alt={photo.caption ?? ""} fill className="object-cover" />
              {isLast && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{photos.length - cols + 1}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
      {lightboxIndex !== null && (
        <Lightbox
          photos={lightboxPhotos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      )}
    </>
  )
}

interface MatchCardProps {
  match: Match & { photos?: MatchPhoto[] }
  index: number
}

function MatchCard({ match, index }: MatchCardProps) {
  const result = resultInfo(match.scoreSpurs, match.scoreOpponent)
  const attendees: string[] = (() => { try { return JSON.parse(match.attendees) } catch { return [] } })()
  const compClass = COMPETITION_COLORS[match.competition] ?? "bg-[#f2f2f7] text-[#3a3a3c]"
  const embedUrl = match.videoUrl ? getEmbedUrl(match.videoUrl) : null
  const photos: MatchPhoto[] = match.photos ?? []

  const dateStr = new Date(match.date).toLocaleDateString("cs-CZ", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  })
  const timeStr = new Date(match.date).toLocaleTimeString("cs-CZ", {
    hour: "2-digit", minute: "2-digit",
  })

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
      <div className="px-5 py-5">
        {/* Top row */}
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

        {/* Photos */}
        <PhotoGallery photos={photos} />
      </div>

      {/* Video embed — always visible when present */}
      {embedUrl && (
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
  matches: (Match & { photos?: MatchPhoto[] })[]
}

function season(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = d.getMonth() + 1 // 1–12
  return m >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`
}

export default function MatchList({ matches }: Props) {
  const wins = matches.filter((m) => m.scoreSpurs > m.scoreOpponent).length
  const draws = matches.filter((m) => m.scoreSpurs === m.scoreOpponent).length
  const losses = matches.filter((m) => m.scoreSpurs < m.scoreOpponent).length
  const goalsFor = matches.reduce((s, m) => s + m.scoreSpurs, 0)
  const goalsAgainst = matches.reduce((s, m) => s + m.scoreOpponent, 0)

  // By competition
  const byCompetition = matches.reduce<Record<string, number>>((acc, m) => {
    acc[m.competition] = (acc[m.competition] ?? 0) + 1
    return acc
  }, {})
  const competitionEntries = Object.entries(byCompetition).sort((a, b) => b[1] - a[1])

  // By season
  const bySeason = matches.reduce<Record<string, number>>((acc, m) => {
    const s = season(m.date)
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})
  const seasonEntries = Object.entries(bySeason).sort((a, b) => b[0].localeCompare(a[0]))

  return (
    <div>
      {matches.length > 0 && (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
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

          {/* By competition + by season */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <div className="bg-white rounded-2xl border border-[#e5e5ea] px-5 py-4">
              <p className="text-xs font-semibold text-[#8e8e93] uppercase tracking-widest mb-3">Podle soutěže</p>
              <div className="space-y-2">
                {competitionEntries.map(([comp, count]) => (
                  <div key={comp} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-[#1d1d1f] truncate">{comp}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="h-1.5 rounded-full bg-[#132257]/20 w-16 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#132257]"
                          style={{ width: `${(count / matches.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-[#1d1d1f] w-5 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e5e5ea] px-5 py-4">
              <p className="text-xs font-semibold text-[#8e8e93] uppercase tracking-widest mb-3">Podle ročníku</p>
              <div className="space-y-2">
                {seasonEntries.map(([s, count]) => (
                  <div key={s} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-[#1d1d1f]">{s}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="h-1.5 rounded-full bg-[#132257]/20 w-16 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#132257]"
                          style={{ width: `${(count / matches.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-[#1d1d1f] w-5 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

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
