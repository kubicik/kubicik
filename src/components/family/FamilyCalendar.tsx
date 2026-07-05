"use client"

import { useState, useCallback } from "react"
import type { FamilyChild, FamilyEvent } from "@/types"

const MONTH_NAMES = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
]
const DAY_NAMES_SHORT = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]
const DAY_NAMES_FULL = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"]

function dateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return `${d}. ${m}. ${y}`
}

type ModalState =
  | { mode: "closed" }
  | { mode: "add"; date: string }
  | { mode: "edit"; event: FamilyEvent }
  | { mode: "day"; date: string; dayEvents: FamilyEvent[] }

interface EventModalProps {
  state: Extract<ModalState, { mode: "add" | "edit" }>
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

interface DayModalProps {
  date: string
  dayEvents: FamilyEvent[]
  childMap: Map<string, FamilyChild>
  onClose: () => void
  onAdd: (date: string) => void
  onEdit: (event: FamilyEvent) => void
}

function DayModal({ date, dayEvents, childMap, onClose, onAdd, onEdit }: DayModalProps) {
  const d = new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)))
  const dayName = DAY_NAMES_FULL[(d.getDay() + 6) % 7]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5e5ea] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#1d1d1f]">{dayName}</h3>
            <p className="text-xs text-[#8e8e93]">{formatDate(date)}</p>
          </div>
          <button
            onClick={() => { onClose(); onAdd(date) }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007aff] text-white text-xs font-medium rounded-lg hover:bg-[#0066d6] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Přidat
          </button>
        </div>

        <div className="divide-y divide-[#f2f2f7] max-h-[60vh] overflow-y-auto">
          {dayEvents.map((event) => {
            const child = event.childId ? childMap.get(event.childId) : null
            const eventColor = event.color ?? child?.color ?? "#3c3c43"
            const multiDay = event.startDate.slice(0, 10) !== event.endDate.slice(0, 10)

            return (
              <button
                key={event.id}
                onClick={() => { onClose(); onEdit(event) }}
                className="w-full text-left px-5 py-3.5 hover:bg-[#f9f9f9] transition-colors flex items-start gap-3"
              >
                <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: eventColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1d1d1f] truncate">{event.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-[#8e8e93]">
                      {child ? child.name : "Celá rodina"}
                    </span>
                    {multiDay && (
                      <span className="text-xs text-[#8e8e93]">
                        · {formatDate(event.startDate)} – {formatDate(event.endDate)}
                      </span>
                    )}
                    {event.note && (
                      <span className="text-xs text-[#8e8e93] truncate">· {event.note}</span>
                    )}
                  </div>
                </div>
                <svg className="w-4 h-4 text-[#c7c7cc] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )
          })}
        </div>

        <div className="px-5 py-3 border-t border-[#e5e5ea]">
          <button onClick={onClose} className="text-sm text-[#8e8e93] hover:text-[#1d1d1f] transition-colors">
            Zavřít
          </button>
        </div>
      </div>
    </div>
  )
}

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startPad = (firstDay.getDay() + 6) % 7
  const days: (Date | null)[] = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month - 1, d))
  }
  while (days.length % 7 !== 0) days.push(null)
  return days
}

const MAX_VISIBLE = 5

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
  const [activeChild, setActiveChild] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ mode: "closed" })
  const [loading, setLoading] = useState(false)

  const childMap = new Map(children.map((c) => [c.id, c]))

  // When a child filter is active: show that child's events + whole-family events (childId === null)
  const filteredEvents = activeChild
    ? events.filter((e) => e.childId === activeChild || e.childId === null)
    : events

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
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-xl transition-colors">
          <svg className="w-5 h-5 text-[#3c3c43]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-[#1d1d1f]">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <button onClick={() => navigate(1)} className="p-2 hover:bg-white rounded-xl transition-colors">
          <svg className="w-5 h-5 text-[#3c3c43]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Child filter */}
      {children.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveChild(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeChild
                ? "bg-[#1d1d1f] text-white"
                : "bg-white text-[#3c3c43] border border-[#e5e5ea] hover:bg-[#f2f2f7]"
            }`}
          >
            Celá rodina
          </button>
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChild(c.id === activeChild ? null : c.id)}
              className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
              style={{
                borderColor: activeChild === c.id ? c.color : "transparent",
                backgroundColor: activeChild === c.id ? c.color + "20" : "white",
                color: activeChild === c.id ? c.color : "#3c3c43",
                borderWidth: "2px",
                borderStyle: "solid",
                ...(activeChild !== c.id && { borderColor: "#e5e5ea", borderWidth: "1px" }),
              }}
            >
              {c.name}
            </button>
          ))}
          {activeChild && (
            <span className="text-xs text-[#8e8e93] ml-1">
              · včetně událostí celé rodiny
            </span>
          )}
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
                    return <div key={dIdx} className="min-h-[96px] bg-[#fafafa] border-l border-[#e5e5ea] first:border-l-0" />
                  }
                  const ds = dateStr(day)
                  const isToday = ds === today
                  const isCurrentMonth = day.getMonth() + 1 === month

                  const dayEvents = filteredEvents.filter((e) => {
                    const start = e.startDate.slice(0, 10)
                    const end = e.endDate.slice(0, 10)
                    return ds >= start && ds <= end
                  })

                  const visible = dayEvents.slice(0, MAX_VISIBLE)
                  const overflow = dayEvents.length - MAX_VISIBLE

                  return (
                    <div
                      key={dIdx}
                      className={`min-h-[96px] p-1.5 border-l border-[#e5e5ea] first:border-l-0 cursor-pointer hover:bg-[#f9f9f9] transition-colors ${
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
                        {visible.map((event) => {
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
                        {overflow > 0 && (
                          <button
                            className="text-[10px] text-[#007aff] font-medium pl-1 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setModal({ mode: "day", date: ds, dayEvents })
                            }}
                          >
                            +{overflow} další
                          </button>
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

      {/* Event edit/add modal */}
      {(modal.mode === "add" || modal.mode === "edit") && (
        <EventModal
          state={modal}
          children={children}
          onClose={() => setModal({ mode: "closed" })}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* Day overflow modal */}
      {modal.mode === "day" && (
        <DayModal
          date={modal.date}
          dayEvents={modal.dayEvents}
          childMap={childMap}
          onClose={() => setModal({ mode: "closed" })}
          onAdd={(date) => setModal({ mode: "add", date })}
          onEdit={(event) => setModal({ mode: "edit", event })}
        />
      )}
    </div>
  )
}
