"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { Match, MatchPhoto } from "@/types"
import { compressImage } from "@/lib/compressImage"
import AttendeeInput from "./AttendeeInput"

const COMPETITIONS = [
  "Premier League",
  "Champions League",
  "Europa League",
  "UEFA Conference League",
  "FA Cup",
  "EFL Cup",
  "Přátelský zápas",
]

const HOME_VENUE = "Tottenham Hotspur Stadium"

interface Props {
  match?: Match & { photos?: MatchPhoto[] }
  suggestions?: string[]
}

export default function MatchForm({ match, suggestions = [] }: Props) {
  const router = useRouter()
  const isEdit = !!match

  const initialAttendees: string[] = match
    ? (() => { try { return JSON.parse(match.attendees) } catch { return [] } })()
    : []

  const [date, setDate] = useState(match ? match.date.slice(0, 16) : "")
  const [competition, setCompetition] = useState(match?.competition ?? "Premier League")
  const [opponent, setOpponent] = useState(match?.opponent ?? "")
  const [homeAway, setHomeAway] = useState<"home" | "away">(
    (match?.homeAway as "home" | "away") ?? "home"
  )
  const [venue, setVenue] = useState(match?.venue ?? (match?.homeAway === "home" ? HOME_VENUE : ""))
  const [scoreSpurs, setScoreSpurs] = useState(match?.scoreSpurs?.toString() ?? "")
  const [scoreOpponent, setScoreOpponent] = useState(match?.scoreOpponent?.toString() ?? "")
  const [attendees, setAttendees] = useState<string[]>(initialAttendees)
  const [videoUrl, setVideoUrl] = useState(match?.videoUrl ?? "")
  const [notes, setNotes] = useState(match?.notes ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Photos
  const [photos, setPhotos] = useState<MatchPhoto[]>(match?.photos ?? [])
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleHomeAwayChange(v: "home" | "away") {
    setHomeAway(v)
    if (v === "home" && !venue) setVenue(HOME_VENUE)
    if (v === "away" && venue === HOME_VENUE) setVenue("")
  }

  function addAttendee(name: string) {
    if (!attendees.includes(name)) setAttendees([...attendees, name])
  }

  function removeAttendee(name: string) {
    setAttendees(attendees.filter((a) => a !== name))
  }

  async function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (!files.length || !match?.id) return
    setUploadProgress({ done: 0, total: files.length })
    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i], "matches")
        const fd = new FormData()
        fd.append("file", compressed)
        fd.append("type", "matches")
        const upRes = await fetch("/api/upload", { method: "POST", body: fd })
        const { url } = await upRes.json()
        const saveRes = await fetch(`/api/matches/${match.id}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        })
        const photo = await saveRes.json()
        setPhotos((prev) => [...prev, photo])
      } catch (err) {
        console.error(err)
      }
      setUploadProgress({ done: i + 1, total: files.length })
    }
    setUploadProgress(null)
  }

  async function deletePhoto(photoId: string) {
    await fetch(`/api/matches/${match!.id}/photos/${photoId}`, { method: "DELETE" })
    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!date || !opponent || scoreSpurs === "" || scoreOpponent === "") {
      setError("Vyplňte datum, soupeře a skóre.")
      return
    }
    setSaving(true)
    try {
      const payload = {
        date,
        competition,
        opponent,
        homeAway,
        venue: venue || null,
        scoreSpurs: Number(scoreSpurs),
        scoreOpponent: Number(scoreOpponent),
        attendees,
        videoUrl: videoUrl || null,
        notes: notes || null,
      }
      const res = await fetch(
        isEdit ? `/api/matches/${match.id}` : "/api/matches",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) throw new Error(await res.text())
      router.push("/admin/matches")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při ukládání")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Základní info */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Základní informace</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#6e6e73] mb-1">Datum a čas</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6e6e73] mb-1">Soutěž</label>
            <select
              value={competition}
              onChange={(e) => setCompetition(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff] bg-white"
            >
              {COMPETITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6e6e73] mb-1">Soupeř</label>
          <input
            type="text"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            placeholder="např. Arsenal"
            className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6e6e73] mb-2">Domácí / Hosté</label>
          <div className="flex gap-3">
            {(["home", "away"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => handleHomeAwayChange(v)}
                className={`flex-1 py-2 text-sm rounded-xl border transition-colors ${
                  homeAway === v
                    ? "bg-[#132257] text-white border-[#132257]"
                    : "bg-white text-[#3a3a3c] border-[#e5e5ea] hover:bg-[#f2f2f7]"
                }`}
              >
                {v === "home" ? "Domácí (White Hart Lane)" : "Hosté (venku)"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6e6e73] mb-1">Stadion / Místo <span className="text-[#c7c7cc]">(volitelné)</span></label>
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="např. Tottenham Hotspur Stadium"
            className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
          />
        </div>
      </div>

      {/* Výsledek */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Výsledek</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#6e6e73] mb-1">Góly Tottenham</label>
            <input
              type="number"
              min={0}
              value={scoreSpurs}
              onChange={(e) => setScoreSpurs(e.target.value)}
              className="w-full px-3 py-2 text-2xl font-bold text-center border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
            />
          </div>
          <span className="text-2xl font-bold text-[#8e8e93] mt-5">–</span>
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#6e6e73] mb-1">Góly soupeře</label>
            <input
              type="number"
              min={0}
              value={scoreOpponent}
              onChange={(e) => setScoreOpponent(e.target.value)}
              className="w-full px-3 py-2 text-2xl font-bold text-center border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
            />
          </div>
        </div>
      </div>

      {/* Účastníci */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 space-y-3">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">S kým jsem byl</h2>
        <AttendeeInput
          attendees={attendees}
          suggestions={suggestions}
          onAdd={addAttendee}
          onRemove={removeAttendee}
        />
      </div>

      {/* Fotografie */}
      {isEdit && (
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">Fotografie ze zápasu</h2>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden bg-[#f2f2f7]">
                  <Image src={photo.url} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => deletePhoto(photo.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-[#ff3b30]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={!!uploadProgress}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#f2f2f7] text-[#3a3a3c] rounded-xl hover:bg-[#e5e5ea] disabled:opacity-50 transition-colors"
            >
              {uploadProgress ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Nahrávám {uploadProgress.done}/{uploadProgress.total}…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Přidat fotky
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoFiles}
            />
          </div>
          <p className="text-xs text-[#8e8e93]">Fotky se nahrávají automaticky po výběru. Uložit zápas není třeba pro správu fotek.</p>
        </div>
      )}

      {!isEdit && (
        <div className="bg-[#f9f9f9] rounded-2xl border border-[#e5e5ea] px-5 py-4">
          <p className="text-sm text-[#8e8e93]">Fotky lze přidat po prvním uložení zápasu.</p>
        </div>
      )}

      {/* Video */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 space-y-3">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Video <span className="text-[#c7c7cc] font-normal">(volitelné)</span></h2>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
        />
        <p className="text-xs text-[#8e8e93]">YouTube odkaz bude zobrazen jako přehrávač na veřejné stránce.</p>
      </div>

      {/* Poznámky */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 space-y-3">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Poznámky <span className="text-[#c7c7cc] font-normal">(volitelné)</span></h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Zážitky, atmosféra, co se přihodilo..."
          className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff] resize-none"
        />
      </div>

      {error && <p className="text-sm text-[#ff3b30]">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] disabled:opacity-50 transition-colors"
        >
          {saving ? "Ukládám…" : isEdit ? "Uložit změny" : "Přidat zápas"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/matches")}
          className="px-6 py-2.5 text-sm text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
        >
          Zrušit
        </button>
      </div>
    </form>
  )
}
