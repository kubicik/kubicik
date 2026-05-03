"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Match } from "@/types"

const COMPETITIONS = [
  "Premier League", "Champions League", "Europa League",
  "UEFA Conference League", "FA Cup", "EFL Cup", "Přátelský zápas",
]

const HOME_VENUE = "Tottenham Hotspur Stadium"

function resultBadge(scoreSpurs: number, scoreOpponent: number) {
  if (scoreSpurs > scoreOpponent) return { label: "V", cls: "bg-[#e8f8ed] text-[#1a7f37]" }
  if (scoreSpurs < scoreOpponent) return { label: "P", cls: "bg-[#fff0f0] text-[#ff3b30]" }
  return { label: "R", cls: "bg-[#f2f2f7] text-[#8e8e93]" }
}

interface Props {
  match: Match
  index: number
}

export default function MatchInlineRow({ match, index }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const initialAttendees: string[] = (() => { try { return JSON.parse(match.attendees) } catch { return [] } })()

  const [date, setDate] = useState(match.date.slice(0, 16))
  const [competition, setCompetition] = useState(match.competition)
  const [opponent, setOpponent] = useState(match.opponent)
  const [homeAway, setHomeAway] = useState<"home" | "away">(match.homeAway as "home" | "away")
  const [scoreSpurs, setScoreSpurs] = useState(match.scoreSpurs.toString())
  const [scoreOpponent, setScoreOpponent] = useState(match.scoreOpponent.toString())
  const [attendees, setAttendees] = useState<string[]>(initialAttendees)
  const [attendeeInput, setAttendeeInput] = useState("")

  const result = resultBadge(match.scoreSpurs, match.scoreOpponent)

  function addAttendee() {
    const name = attendeeInput.trim()
    if (!name || attendees.includes(name)) return
    setAttendees([...attendees, name])
    setAttendeeInput("")
  }

  function handleHomeAwayChange(v: "home" | "away") {
    setHomeAway(v)
  }

  function cancelEdit() {
    setEditing(false)
    setDate(match.date.slice(0, 16))
    setCompetition(match.competition)
    setOpponent(match.opponent)
    setHomeAway(match.homeAway as "home" | "away")
    setScoreSpurs(match.scoreSpurs.toString())
    setScoreOpponent(match.scoreOpponent.toString())
    setAttendees(initialAttendees)
    setAttendeeInput("")
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/matches/${match.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        competition,
        opponent,
        homeAway,
        venue: homeAway === "home" ? HOME_VENUE : (match.homeAway !== homeAway ? "" : match.venue),
        scoreSpurs: Number(scoreSpurs),
        scoreOpponent: Number(scoreOpponent),
        attendees,
        videoUrl: match.videoUrl,
        notes: match.notes,
      }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/matches/${match.id}`, { method: "DELETE" })
    router.refresh()
  }

  const attendeesDisplay = initialAttendees.join(", ")
  const dateDisplay = new Date(match.date).toLocaleDateString("cs-CZ", {
    day: "numeric", month: "long", year: "numeric",
  })

  if (editing) {
    return (
      <div className="px-6 py-5 bg-[#fafbff] border-b border-[#e5e5ea]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-[#6e6e73] mb-1 block">Datum a čas</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
            />
          </div>
          <div>
            <label className="text-xs text-[#6e6e73] mb-1 block">Soutěž</label>
            <select
              value={competition}
              onChange={(e) => setCompetition(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff] bg-white"
            >
              {COMPETITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#6e6e73] mb-1 block">Soupeř</label>
            <input
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
            />
          </div>
          <div>
            <label className="text-xs text-[#6e6e73] mb-1 block">Domácí / Hosté</label>
            <div className="flex gap-2">
              {(["home", "away"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleHomeAwayChange(v)}
                  className={`flex-1 py-1.5 text-xs rounded-xl border transition-colors ${
                    homeAway === v ? "bg-[#132257] text-white border-[#132257]" : "bg-white text-[#3a3a3c] border-[#e5e5ea] hover:bg-[#f2f2f7]"
                  }`}
                >
                  {v === "home" ? "Domácí" : "Hosté"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#6e6e73]">Spurs</label>
            <input
              type="number" min={0} value={scoreSpurs}
              onChange={(e) => setScoreSpurs(e.target.value)}
              className="w-14 px-2 py-1.5 text-base font-bold text-center border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
            />
          </div>
          <span className="text-[#8e8e93]">–</span>
          <div className="flex items-center gap-2">
            <input
              type="number" min={0} value={scoreOpponent}
              onChange={(e) => setScoreOpponent(e.target.value)}
              className="w-14 px-2 py-1.5 text-base font-bold text-center border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
            />
            <label className="text-xs text-[#6e6e73]">Soupeř</label>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-[#6e6e73] mb-1 block">S kým</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text" value={attendeeInput}
              onChange={(e) => setAttendeeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAttendee() } }}
              placeholder="Jméno..."
              className="flex-1 px-3 py-1.5 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:border-[#007aff]"
            />
            <button type="button" onClick={addAttendee} className="px-3 py-1.5 text-xs bg-[#f2f2f7] rounded-xl hover:bg-[#e5e5ea]">Přidat</button>
          </div>
          {attendees.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {attendees.map((a) => (
                <span key={a} className="flex items-center gap-1 px-2.5 py-0.5 bg-[#132257]/10 text-[#132257] text-xs rounded-full">
                  {a}
                  <button type="button" onClick={() => setAttendees(attendees.filter((x) => x !== a))} className="hover:text-[#ff3b30]">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] disabled:opacity-50 transition-colors"
          >
            {saving ? "Ukládám…" : "Uložit"}
          </button>
          <button type="button" onClick={cancelEdit} className="text-sm text-[#6e6e73] hover:text-[#1d1d1f]">Zrušit</button>
          <Link href={`/admin/matches/${match.id}`} className="ml-auto text-xs text-[#8e8e93] hover:text-[#007aff]">
            Fotky a video →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-[#f9f9f9] transition-colors border-b border-[#e5e5ea] last:border-0">
      <span className="flex-shrink-0 w-7 text-center text-xs font-semibold text-[#8e8e93]">{index}</span>
      <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${result.cls}`}>
        {result.label}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-[#1d1d1f] text-sm">
            {match.homeAway === "home" ? "Spurs" : match.opponent}
            {" "}<span className="font-bold">{match.scoreSpurs} – {match.scoreOpponent}</span>{" "}
            {match.homeAway === "home" ? match.opponent : "Spurs"}
          </p>
          <span className="text-xs px-2 py-0.5 bg-[#f2f2f7] text-[#6e6e73] rounded-full">{match.competition}</span>
        </div>
        <p className="text-[#8e8e93] text-xs mt-0.5">
          {dateDisplay}
          {attendeesDisplay && ` · ${attendeesDisplay}`}
          {match.videoUrl && " · 🎥"}
          {(match.photos?.length ?? 0) > 0 && ` · 📷 ${match.photos!.length}`}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button onClick={() => setEditing(true)} className="text-sm text-[#007aff] hover:underline">Upravit</button>
        {confirming ? (
          <>
            <button onClick={handleDelete} disabled={deleting} className="text-xs text-white bg-[#ff3b30] px-3 py-1 rounded-lg hover:bg-[#d63029] disabled:opacity-50">
              {deleting ? "Mažu…" : "Smazat"}
            </button>
            <button onClick={() => setConfirming(false)} className="text-xs text-[#6e6e73]">Zrušit</button>
          </>
        ) : (
          <button onClick={() => setConfirming(true)} className="text-sm text-[#ff3b30] hover:underline">Smazat</button>
        )}
      </div>
    </div>
  )
}
