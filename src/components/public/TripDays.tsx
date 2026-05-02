"use client"

import { useState } from "react"
import Image from "next/image"
import type { Stop, Photo } from "@/types"

// ── Inline renderer: **bold**, *italic*, ==highlight== ───────────────────────
function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|==[^=]+==[^=]?)/g).map((seg, i) => {
    if (seg.startsWith("**") && seg.endsWith("**"))
      return <strong key={i}>{seg.slice(2, -2)}</strong>
    if (seg.startsWith("*") && seg.endsWith("*"))
      return <em key={i}>{seg.slice(1, -1)}</em>
    if (seg.startsWith("==") && seg.endsWith("=="))
      return (
        <mark key={i} className="bg-amber-100 text-amber-900 px-0.5 rounded-sm not-italic">
          {seg.slice(2, -2)}
        </mark>
      )
    return seg
  })
}

// Splits description into content paragraphs and optional blockquote blocks.
// Lines starting with "> " become blockquotes; double newline = paragraph break.
function renderDescription(text: string): React.ReactNode {
  if (!text.trim()) return null
  return (
    <div className="space-y-3 text-[#3a3a3c] text-sm leading-[1.8]">
      {text.split(/\n\n+/).map((para, i) => {
        if (para.trimStart().startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-[3px] border-[#007aff] pl-4 italic text-[#6e6e73]"
            >
              {para.trimStart().slice(2).split(/\n/).map((line, li, arr) => (
                <span key={li}>
                  {renderInline(line.trimStart().replace(/^>\s*/, ""))}
                  {li < arr.length - 1 && <br />}
                </span>
              ))}
            </blockquote>
          )
        }
        return (
          <p key={i}>
            {para.split(/\n/).map((line, li, arr) => (
              <span key={li}>
                {renderInline(line)}
                {li < arr.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

// ── Photo grid — 2 columns, caption overlay ──────────────────────────────────
function PhotoGrid({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null
  return (
    <div className={`grid gap-2 mt-4 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {photos.map((photo, i) => (
        <div
          key={photo.id}
          className={`relative overflow-hidden rounded-xl bg-[#f2f2f7] ${
            photos.length === 1 ? "aspect-[16/9]" : "aspect-square"
          } ${photos.length % 2 === 1 && i === 0 ? "col-span-2 aspect-[16/9]" : ""}`}
        >
          <Image
            src={photo.url}
            alt={photo.caption ?? ""}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 560px"
          />
          {photo.caption && (
            <p className="absolute bottom-0 left-0 right-0 text-xs text-white bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
              {photo.caption}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Tag ──────────────────────────────────────────────────────────────────────
interface Tag { emoji: string; label: string }

function parseTags(raw: string | null): Tag[] {
  if (!raw) return []
  try { return JSON.parse(raw) as Tag[] } catch { return [] }
}

// ── Day grouping ─────────────────────────────────────────────────────────────
interface DayGroup {
  date: string
  stops: Stop[]
  dayIndex: number
}

function groupByDay(stops: Stop[]): DayGroup[] {
  const map = new Map<string, Stop[]>()
  for (const stop of stops) {
    const key = stop.date ? stop.date.slice(0, 10) : "unknown"
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(stop)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayStops], i) => ({ date, stops: dayStops, dayIndex: i + 1 }))
}

function formatDay(dateStr: string): string {
  if (dateStr === "unknown") return "Ostatní"
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

// ── Main component ───────────────────────────────────────────────────────────
interface Props { stops: Stop[] }

export default function TripDays({ stops }: Props) {
  const days = groupByDay(stops)
  const [openDay, setOpenDay] = useState<number | null>(0)

  function handleToggle(e: React.MouseEvent<HTMLButtonElement>, i: number) {
    const btn = e.currentTarget
    const topBefore = btn.getBoundingClientRect().top
    setOpenDay(openDay === i ? null : i)
    // After React re-renders (double rAF to wait for paint), compensate for the
    // layout shift caused by the previously-open day collapsing so the clicked
    // header stays at the same viewport position.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollBy(0, btn.getBoundingClientRect().top - topBefore)
      })
    })
  }

  return (
    <section className="py-16 bg-[#fafafa]">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-2">Den po dni</h2>
        <p className="text-[#6e6e73] text-base mb-10">
          Každý den trasy – zastávky, zážitky, fotky.
        </p>

        <div className="space-y-3">
          {days.map((day, i) => {
            const isOpen = openDay === i
            const allPhotos = day.stops.flatMap((s) => s.photos ?? []).slice(0, 4)
            const route = day.stops.map((s) => s.title).join(" → ")
            const dayTags: Tag[] = day.stops.flatMap((s) => parseTags(s.tags))

            return (
              <div
                key={day.date}
                className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden"
              >
                {/* ── Accordion header ───────────────────────────────── */}
                <button
                  onClick={(e) => handleToggle(e, i)}
                  className="w-full px-6 py-5 flex items-start gap-4 text-left hover:bg-[#fafafa] transition-colors"
                >
                  {/* Day number circle */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1d1d1f] text-white text-sm font-semibold flex items-center justify-center mt-0.5">
                    {day.dayIndex}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-[#8e8e93] font-medium uppercase tracking-widest mb-0.5">
                          Den {day.dayIndex}
                        </p>
                        <h3 className="text-base font-semibold text-[#1d1d1f]">
                          {formatDay(day.date)}
                        </h3>
                        <p className="text-sm text-[#6e6e73] mt-1">
                          {route}
                        </p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-[#8e8e93] flex-shrink-0 transition-transform duration-200 mt-1 ${isOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Thumbnail strip when closed */}
                    {!isOpen && allPhotos.length > 0 && (
                      <div className="flex gap-1.5 mt-3">
                        {allPhotos.slice(0, 4).map((p) => (
                          <div key={p.id} className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#f2f2f7] flex-shrink-0">
                            <Image src={p.url} alt={p.caption ?? ""} fill className="object-cover" />
                          </div>
                        ))}
                        {day.stops.flatMap((s) => s.photos ?? []).length > 4 && (
                          <div className="w-12 h-12 rounded-lg bg-[#f2f2f7] flex items-center justify-center text-xs text-[#8e8e93] font-medium flex-shrink-0">
                            +{day.stops.flatMap((s) => s.photos ?? []).length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>

                {/* ── Expanded content ────────────────────────────────── */}
                {isOpen && (
                  <div className="border-t border-[#f2f2f7] px-6 py-6 space-y-8">
                    {day.stops.map((stop) => (
                      <div key={stop.id}>
                        <h4 className="text-base font-semibold text-[#1d1d1f] mb-3">
                          {stop.title}
                        </h4>
                        {stop.description && renderDescription(stop.description)}
                        {(stop.photos?.length ?? 0) > 0 && (
                          <PhotoGrid photos={stop.photos!} />
                        )}
                      </div>
                    ))}

                    {/* Tags row */}
                    {dayTags.length > 0 && (
                      <div className="pt-2 border-t border-[#f2f2f7] flex flex-wrap gap-2">
                        {dayTags.map((tag, ti) => (
                          <span
                            key={ti}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f2f2f7] text-[#3a3a3c] text-xs rounded-full"
                          >
                            <span>{tag.emoji}</span>
                            <span>{tag.label}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
