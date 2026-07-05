"use client"

import { useState, useCallback } from "react"
import type { FamilyChild, FamilyEvent } from "@/types"

const MONTH_NAMES = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
]
const DAY_NAMES_SHORT = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]

function dateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return new Date(y, m - 1, d)
}

type ModalState =
  | { mode: "closed" }
  | { mode: "add"; date: string }
  | { mode: "edit"; event: FamilyEvent }

interface EventModalProps {
  state: ModalState
  children: FamilyChild[]
  onClose: () => void
  onSave: (data: Omit<FamilyEvent, "id" | "createdAt">) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

const PALETTE = [
  "#007aff", "#34c759", "#ff9500", "#ff3b30", "#af52de",
  "#5ac8fa", "#ff2d55", "#00c7be", "#ffcc00", "#8e8e93",
]

function EventModal({ state, children, onClose, onSave, onDelete }: EventModalProps) {
  const initial = state.mode === "edit" ? state.event : null
  const defaultDate = state.mode === "add" ? state.date : ""
  const [childId, setChildId] = useState<string>(initial?.childId ?? "")
  const [title, setTitle] = useState(initial?.title ?? "")
  const [startDate, setStartDate] = useState(initial ? initial.startDate.slice(0, 10) : defaultDate)
  const [endDate, setEndDate] = useState(initial ? initial.endDate.slice(0, 10) : defaultDate)
  const [color, setColor] = useState(initial?.color ?? "#007aff")
  const [note, setNote] = useState(initial?.note ?? "")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    if (!title.trim() || !startDate || !endDate) return
    setSaving(true)
    try {
      await onSave({
        childId: childId || null,
        title: title.trim(),
        startDate,
        endDate: endDate >= startDate ? endDate : startDate,
        color,
        note: note || null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (state.mode !== "edit") return
    setDeleting(true)
    try {
      await onDelete?.(state.event.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        <h3 className="text-base font-semibold text-[#1d1d1f] mb-4">
          {state.mode === "edit" ? "Upravit událost" : "Přidat událost"}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#8e8e93] mb-1">Název</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="např. Tábor, Babička, Výlet..."
              className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8e8e93] mb-1">Kdo</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setChildId("")}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                  !childId ? "bg-[#1d1d1f] text-white border-[#1d1d1f]" : "border-[#e5e5ea] text-[#3c3c43] hover:bg-[#f2f2f7]"
                }`}
              >
                Celá rodina
              </button>
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChildId(c.id)}
                  className="px-3 py-1 rounded-full text-sm font-medium border-2 transition-all"
                  style={{
                    borderColor: childId === c.id ? c.color : "transparent",
                    backgroundColor: childId === c.id ? c.color + "20" : "#f2f2f7",
                    color: childId === c.id ? c.color : "#3c3c43",
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#8e8e93] mb-1">Od</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#8e8e93] mb-1">Do</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8e8e93] mb-1.5">Barva</label>
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8e8e93] mb-1">Poznámka (volitelné)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Doplňující informace..."
              className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          {state.mode === "edit" && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-2 text-sm text-[#ff3b30] hover:bg-[#fff2f0] rounded-xl transition-colors"
            >
              {deleting ? "..." : "Smazat"}
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#8e8e93] hover:bg-[#f2f2f7] rounded-xl transition-colors">
            Zrušit
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-2 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] disabled:opacity-50 transition-colors"
          >
            {saving ? "Ukládám..." : "Uložit"}
          </button>
        </div>
      </div>
    </div>
  )
}

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  // Czech: week starts Monday (dayOfWeek: Mon=0, ..., Sun=6)
  const startPad = (firstDay.getDay() + 6) % 7
  const days: (Date | null)[] = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month - 1, d))
  }
  // pad to full weeks
  while (days.length % 7 !== 0) days.push(null)
  return days
}

interface Props {
  initialEvents: FamilyEvent[]
  initialChildren: FamilyChild[]
  initialYear: number
  initialMonth: number
}

export default function FamilyCalendar({ initialEvents, initialChildren, initialYear, initialMonth }: Props) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [events, setEvents] = useState<FamilyEvent[]>(initialEvents)
  const [children] = useState<FamilyChild[]>(initialChildren)
  const [modal, setModal] = useState<ModalState>({ mode: "closed" })
  const [loading, setLoading] = useState(false)

  const childMap = new Map(children.map((c) => [c.id, c]))

  async function navigate(deltaMonth: number) {
    let newMonth = month + deltaMonth
    let newYear = year
    if (newMonth > 12) { newMonth = 1; newYear++ }
    if (newMonth < 1) { newMonth = 12; newYear-- }
    setLoading(true)
    setMonth(newMonth)
    setYear(newYear)
    try {
      const res = await fetch(`/api/family/events?year=${newYear}&month=${newMonth}`)
      setEvents(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const handleSave = useCallback(
    async (data: Omit<FamilyEvent, "id" | "createdAt">) => {
      if (modal.mode === "edit") {
        const res = await fetch(`/api/family/events/${modal.event.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        const updated = await res.json()
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
      } else {
        const res = await fetch("/api/family/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        const created = await res.json()
        setEvents((prev) => [...prev, created])
      }
    },
    [modal]
  )

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/family/events/${id}`, { method: "DELETE" })
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const days = getMonthDays(year, month)
  const today = dateStr(new Date())

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white rounded-xl transition-colors"
        >
          <svg className="w-5 h-5 text-[#3c3c43]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-[#1d1d1f]">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <button
          onClick={() => navigate(1)}
          className="p-2 hover:bg-white rounded-xl transition-colors"
        >
          <svg className="w-5 h-5 text-[#3c3c43]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      {children.length > 0 && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#3c3c43]" />
            <span className="text-xs text-[#8e8e93]">Celá rodina</span>
          </div>
          {children.map((c) => (
            <div key={c.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-xs text-[#8e8e93]">{c.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className={`bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden transition-opacity ${loading ? "opacity-60" : ""}`}>
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[#e5e5ea]">
          {DAY_NAMES_SHORT.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-[#8e8e93]">{d}</div>
          ))}
        </div>

        {/* Weeks */}
        <div>
          {Array.from({ length: days.length / 7 }, (_, weekIdx) => {
            const weekDays = days.slice(weekIdx * 7, weekIdx * 7 + 7)
            return (
              <div key={weekIdx} className="grid grid-cols-7 border-b border-[#e5e5ea] last:border-b-0">
                {weekDays.map((day, dIdx) => {
                  if (!day) {
                    return <div key={dIdx} className="min-h-[80px] bg-[#fafafa] border-l border-[#e5e5ea] first:border-l-0" />
                  }
                  const ds = dateStr(day)
                  const isToday = ds === today
                  const isCurrentMonth = day.getMonth() + 1 === month

                  const dayEvents = events.filter((e) => {
                    const start = e.startDate.slice(0, 10)
                    const end = e.endDate.slice(0, 10)
                    return ds >= start && ds <= end
                  })

                  return (
                    <div
                      key={dIdx}
                      className={`min-h-[80px] p-1.5 border-l border-[#e5e5ea] first:border-l-0 cursor-pointer hover:bg-[#f9f9f9] transition-colors ${
                        !isCurrentMonth ? "bg-[#fafafa]" : ""
                      }`}
                      onClick={() => setModal({ mode: "add", date: ds })}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                            isToday
                              ? "bg-[#007aff] text-white"
                              : isCurrentMonth
                              ? "text-[#1d1d1f]"
                              : "text-[#c7c7cc]"
                          }`}
                        >
                          {day.getDate()}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((event) => {
                          const child = event.childId ? childMap.get(event.childId) : null
                          const eventColor = event.color ?? child?.color ?? "#3c3c43"
                          const isStart = event.startDate.slice(0, 10) === ds
                          return (
                            <div
                              key={event.id}
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium truncate cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: eventColor + "25", color: eventColor }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setModal({ mode: "edit", event })
                              }}
                              title={event.title + (event.note ? `\n${event.note}` : "")}
                            >
                              {isStart ? event.title : "↳ " + event.title}
                            </div>
                          )
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[9px] text-[#8e8e93] pl-1">
                            +{dayEvents.length - 3} další
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {modal.mode !== "closed" && (
        <EventModal
          state={modal}
          children={children}
          onClose={() => setModal({ mode: "closed" })}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
