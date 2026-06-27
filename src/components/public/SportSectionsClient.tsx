"use client"

import { useState } from "react"
import Link from "next/link"
import { relativeTime, seriesLastChanged } from "@/lib/relativeTime"

type SeriesItem = {
  id: string; name: string; year: number; slug: string
  sport: string; tier: string; imageUrl: string | null
  isPricingEnabled: boolean
  tags: { id: string; name: string; color: string; symbol: string }[]
  updatedAt: Date; totalCardsCount: number
  cards: { variants: { isOwned: boolean; updatedAt: Date; price: number | null }[] }[]
}

type SportGroup = {
  value: string
  label: string
  premium: SeriesItem[]
  regular: SeriesItem[]
}

function SeriesCard({ s, now }: { s: SeriesItem; now: Date }) {
  const allVariants = s.cards.flatMap((c) => c.variants)
  const ownedCount = allVariants.filter((v) => v.isOwned).length
  const pct = s.totalCardsCount > 0 ? Math.min(100, Math.round((ownedCount / s.totalCardsCount) * 100)) : 0
  const lastChanged = seriesLastChanged(s.updatedAt, allVariants.map((v) => v.updatedAt))
  const collectionValue = s.isPricingEnabled
    ? Math.round(allVariants.filter((v) => v.isOwned).reduce((sum, v) => sum + (v.price ?? 0), 0))
    : null

  return (
    <Link
      href={`/kartickar/${s.slug}`}
      className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-shadow group"
    >
      {s.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.imageUrl} alt={s.name} className="w-14 h-20 object-cover rounded-xl flex-shrink-0 border border-[#e5e5ea]" />
      ) : (
        <div className="w-14 h-20 rounded-xl bg-[#f2f2f7] flex items-center justify-center flex-shrink-0 border border-[#e5e5ea]">
          <svg className="w-6 h-6 text-[#c7c7cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <h3 className="font-semibold text-[#1d1d1f] group-hover:text-[#007aff] transition-colors truncate">{s.name}</h3>
          <span className="text-xs text-[#8e8e93] flex-shrink-0">{s.year}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {s.tier === "premium" && (
            <span className="text-xs text-[#ff9f0a]">⭐ Prémiová</span>
          )}
          {s.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.symbol} {tag.name}
            </span>
          ))}
        </div>
        <p className="text-xs text-[#8e8e93] mb-2">
          {ownedCount} / {s.totalCardsCount > 0 ? s.totalCardsCount : "?"} variant
          {collectionValue != null && <span className="text-[#34c759] ml-2">· {collectionValue.toLocaleString("cs-CZ")} Kč</span>}
        </p>
        <div className="h-2 bg-[#e5e5ea] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#34c759" : pct > 50 ? "#007aff" : "#ff9f0a" }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs font-medium text-[#3c3c43]">{pct}% nasbíráno</p>
          <p className="text-xs text-[#c7c7cc]">{relativeTime(lastChanged, now)}</p>
        </div>
      </div>
    </Link>
  )
}

const SPORT_META: Record<string, { emoji: string; label: string; accent: string }> = {
  football:   { emoji: "⚽", label: "Fotbal",    accent: "#34c759" },
  hockey:     { emoji: "🏒", label: "Hokej",     accent: "#007aff" },
  basketball: { emoji: "🏀", label: "Basketbal", accent: "#ff9f0a" },
}

interface Props {
  bySport: SportGroup[]
  now: Date
}

export default function SportSectionsClient({ bySport, now }: Props) {
  const [activeSport, setActiveSport] = useState<string>("all")

  const visibleSports = activeSport === "all" ? bySport : bySport.filter((g) => g.value === activeSport)
  const multipleSports = bySport.length > 1

  return (
    <div>
      {multipleSports && (
        <div className="flex gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setActiveSport("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeSport === "all"
                ? "bg-[#1d1d1f] text-white"
                : "bg-white text-[#3c3c43] border border-[#e5e5ea] hover:bg-[#f2f2f7]"
            }`}
          >
            Vše
          </button>
          {bySport.map((group) => {
            const meta = SPORT_META[group.value] ?? { emoji: "🃏", label: group.label, accent: "#8e8e93" }
            const isActive = activeSport === group.value
            return (
              <button
                key={group.value}
                onClick={() => setActiveSport(group.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  isActive ? "text-white border-transparent" : "bg-white text-[#3c3c43] border-[#e5e5ea] hover:bg-[#f2f2f7]"
                }`}
                style={isActive ? { backgroundColor: meta.accent, borderColor: meta.accent } : {}}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-[#f2f2f7] text-[#8e8e93]"}`}>
                  {group.premium.length + group.regular.length}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="space-y-10">
        {visibleSports.map((group) => {
          const hasBothTiers = group.premium.length > 0 && group.regular.length > 0
          const meta = SPORT_META[group.value] ?? { emoji: "🃏", label: group.label, accent: "#8e8e93" }
          return (
            <section key={group.value}>
              {multipleSports && activeSport === "all" && (
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: `${meta.accent}22` }}
                  >
                    {meta.emoji}
                  </div>
                  <h2 className="text-lg font-bold text-[#1d1d1f]">{meta.label}</h2>
                  <div className="flex-1 h-px bg-[#e5e5ea]" />
                  <span className="text-xs text-[#8e8e93]">{group.premium.length + group.regular.length} sérií</span>
                </div>
              )}
              <div className="space-y-8">
                {group.premium.length > 0 && (
                  <div>
                    {hasBothTiers && (
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#ff9f0a] mb-3">⭐ Prémiové</p>
                    )}
                    <div className="space-y-4">
                      {group.premium.map((s) => <SeriesCard key={s.id} s={s} now={now} />)}
                    </div>
                  </div>
                )}
                {group.regular.length > 0 && (
                  <div>
                    {hasBothTiers && (
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#8e8e93] mb-3">Řadové</p>
                    )}
                    <div className="space-y-4">
                      {group.regular.map((s) => <SeriesCard key={s.id} s={s} now={now} />)}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
