"use client"

import { useState } from "react"
import Image from "next/image"

interface VideoResult {
  videoId: string
  title: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
}

interface Props {
  initialQuery: string
  onSelect: (url: string) => void
  onClose: () => void
}

export default function YouTubeSearch({ initialQuery, onSelect, onClose }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<VideoResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState("")

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    setError("")
    setSearched(false)
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error === "NO_API_KEY"
          ? "YouTube API klíč není nastaven (YOUTUBE_API_KEY v prostředí)."
          : (data.error ?? "Chyba při vyhledávání"))
        return
      }
      setResults(data.videos ?? [])
      setSearched(true)
    } catch {
      setError("Nepodařilo se připojit k YouTube.")
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="border border-[#e5e5ea] rounded-2xl overflow-hidden bg-[#fafafa]">
      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-[#e5e5ea] bg-white">
        <svg className="w-4 h-4 text-[#ff0000] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Hledat video na YouTube…"
          className="flex-1 text-sm bg-transparent focus:outline-none text-[#1d1d1f] placeholder:text-[#c7c7cc]"
        />
        <button
          type="button"
          onClick={search}
          disabled={searching || !query.trim()}
          className="flex-shrink-0 px-3 py-1 bg-[#ff0000] text-white text-xs font-medium rounded-lg hover:bg-[#cc0000] disabled:opacity-50 transition-colors"
        >
          {searching ? "…" : "Hledat"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[#8e8e93] hover:text-[#1d1d1f] rounded-full hover:bg-[#f2f2f7] transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 text-xs text-[#c62828] bg-[#fff2f2]">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="divide-y divide-[#f2f2f7] max-h-[420px] overflow-y-auto">
          {results.map((v) => (
            <button
              key={v.videoId}
              type="button"
              onClick={() => {
                onSelect(`https://www.youtube.com/watch?v=${v.videoId}`)
                onClose()
              }}
              className="w-full flex items-start gap-3 px-3 py-3 hover:bg-[#f0f6ff] transition-colors text-left"
            >
              <div className="relative flex-shrink-0 w-28 aspect-video rounded-lg overflow-hidden bg-[#e5e5ea]">
                {v.thumbnail && (
                  <Image
                    src={v.thumbnail}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-medium text-[#1d1d1f] line-clamp-2 leading-snug">{v.title}</p>
                <p className="text-xs text-[#8e8e93] mt-1">{v.channelTitle}</p>
                <p className="text-xs text-[#c7c7cc]">
                  {new Date(v.publishedAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <svg className="w-4 h-4 text-[#007aff] flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {searched && results.length === 0 && !error && (
        <div className="px-4 py-6 text-center text-sm text-[#8e8e93]">
          Žádné výsledky pro „{query}".
        </div>
      )}

      {!searched && !searching && results.length === 0 && !error && (
        <div className="px-4 py-4 text-center text-xs text-[#c7c7cc]">
          Stiskněte Enter nebo klikněte Hledat
        </div>
      )}
    </div>
  )
}
