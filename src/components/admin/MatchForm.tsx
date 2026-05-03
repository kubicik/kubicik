"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Match } from "@/types"

const COMPETITIONS = [
  "Premier League",
  "Champions League",
  "Europa League",
  "UEFA Conference League",
  "FA Cup",
  "EFL Cup",
  "Přátelský zápas",
]

interface Props {
  match?: Match
}

export default function MatchForm({ match }: Props) {
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
  const [venue, setVenue] = useState(match?.venue ?? "")
  const [scoreSpurs, setScoreSpurs] = useState(match?.scoreSpurs?.toString() ?? "")
  const [scoreOpponent, setScoreOpponent] = useState(match?.scoreOpponent?.toString() ?? "")
  const [attendees, setAttendees] = useState<string[]>(initialAttendees)
  const [attendeeInput, setAttendeeInput] = useState("")
  const [videoUrl, setVideoUrl] = useState(match?.videoUrl ?? "")
  const [notes, setNotes] = useState(match?.notes ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function addAttendee() {
    const name = attendeeInput.trim()
    if (!name || attendees.includes(name)) return
    setAttendees([...attendees, name])
    setAttendeeInput("")
  }

  function removeAttendee(name: string) {
    setAttendees(attendees.filter((a) => a !== name))
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
                onClick={() => setHomeAway(v)}
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
        <div className="flex gap-2">
          <input
            type="text"
            value={attendeeInput}
            onChange={(e) => setAttendeeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAttendee() } }}
            placeholder="Jméno..."
            className="flex-1 px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
          />
          <button
            type="button"
            onClick={addAttendee}
            className="px-4 py-2 text-sm bg-[#f2f2f7] text-[#3a3a3c] rounded-xl hover:bg-[#e5e5ea] transition-colors"
          >
            Přidat
          </button>
        </div>
        {attendees.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attendees.map((a) => (
              <span key={a} className="flex items-center gap-1.5 px-3 py-1 bg-[#132257]/10 text-[#132257] text-xs rounded-full">
                {a}
                <button type="button" onClick={() => removeAttendee(a)} className="hover:text-[#ff3b30]">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

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
