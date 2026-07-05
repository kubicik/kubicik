"use client"

import { useState, useCallback } from "react"
import type { FamilyChild, Activity } from "@/types"

const DAY_NAMES = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"]
const DAY_SHORT = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]

const START_HOUR = 7
const END_HOUR = 22
const PX_PER_HOUR = 64
const TOTAL_H = (END_HOUR - START_HOUR) * PX_PER_HOUR

function timeToY(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return ((h - START_HOUR) * 60 + m) * (PX_PER_HOUR / 60)
}

function durationH(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  const mins = Math.max(15, (eh * 60 + em) - (sh * 60 + sm))
  return mins * (PX_PER_HOUR / 60)
}

type ModalState =
  | { mode: "closed" }
  | { mode: "add"; dayOfWeek: number }
  | { mode: "edit"; activity: Activity }

interface ModalProps {
  state: ModalState
  children: FamilyChild[]
  onClose: () => void
  onSave: (data: Omit<Activity, "id" | "createdAt">) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

function ActivityModal({ state, children, onClose, onSave, onDelete }: ModalProps) {
  const initial = state.mode === "edit" ? state.activity : null
  const [childId, setChildId] = useState(initial?.childId ?? children[0]?.id ?? "")
  const [name, setName] = useState(initial?.name ?? "")
  const [dayOfWeek, setDayOfWeek] = useState(initial?.dayOfWeek ?? (state.mode === "add" ? state.dayOfWeek : 1))
  const [startTime, setStartTime] = useState(initial?.startTime ?? "14:00")
  const [endTime, setEndTime] = useState(initial?.endTime ?? "15:30")
  const [location, setLocation] = useState(initial?.location ?? "")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    if (!name.trim() || !childId) return
    setSaving(true)
    try {
      await onSave({ childId, name: name.trim(), dayOfWeek, startTime, endTime, location: location || null, color: null })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (state.mode !== "edit") return
    setDeleting(true)
    try {
      await onDelete?.(state.activity.id)
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
          {state.mode === "edit" ? "Upravit kroužek" : "Přidat kroužek"}
        </h3>

        <div className="space-y-3">
          {children.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-[#8e8e93] mb-1">Dítě</label>
              <div className="flex gap-2 flex-wrap">
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
          )}

          <div>
            <label className="block text-xs font-medium text-[#8e8e93] mb-1">Název kroužku</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="např. Fotbal, Angličtina..."
              className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8e8e93] mb-1">Den v týdnu</label>
            <div className="flex gap-1.5 flex-wrap">
              {DAY_SHORT.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setDayOfWeek(i + 1)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    dayOfWeek === i + 1
                      ? "bg-[#007aff] text-white"
                      : "bg-[#f2f2f7] text-[#3c3c43] hover:bg-[#e5e5ea]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#8e8e93] mb-1">Začátek</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#8e8e93] mb-1">Konec</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8e8e93] mb-1">Místo (volitelné)</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="např. TJ Sokol, DDM..."
              className="w-full px-3 py-2 text-sm border border-[#e5e5ea] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 focus:border-[#007aff]"
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
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] disabled:opacity-50 transition-colors"
          >
            {saving ? "Ukládám..." : "Uložit"}
          </button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  initialActivities: Activity[]
  initialChildren: FamilyChild[]
}

export default function WeeklySchedule({ initialActivities, initialChildren }: Props) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [children] = useState<FamilyChild[]>(initialChildren)
  const [modal, setModal] = useState<ModalState>({ mode: "closed" })
  const [activeChild, setActiveChild] = useState<string | null>(null)

  const childMap = new Map(children.map((c) => [c.id, c]))

  const handleSave = useCallback(
    async (data: Omit<Activity, "id" | "createdAt">) => {
      if (modal.mode === "edit") {
        const res = await fetch(`/api/family/activities/${modal.activity.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        const updated = await res.json()
        setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      } else {
        const res = await fetch("/api/family/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        const created = await res.json()
        setActivities((prev) => [...prev, created])
      }
    },
    [modal]
  )

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/family/activities/${id}`, { method: "DELETE" })
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const filtered = activeChild ? activities.filter((a) => a.childId === activeChild) : activities

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

  return (
    <div>
      {/* Child filter */}
      {children.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveChild(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeChild ? "bg-[#1d1d1f] text-white" : "bg-white text-[#3c3c43] hover:bg-[#f2f2f7] border border-[#e5e5ea]"
            }`}
          >
            Všechny děti
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
                borderWidth: activeChild === c.id ? "2px" : "1px",
                borderStyle: "solid",
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {children.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-[#e5e5ea]">
          <p className="text-[#8e8e93] text-sm mb-3">Nejprve přidejte děti v Nastavení.</p>
          <a href="/family/settings" className="text-[#007aff] text-sm hover:underline">Přejít do nastavení →</a>
        </div>
      ) : (
        /* Time grid */
        <div className="bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden">
          {/* Header */}
          <div className="grid border-b border-[#e5e5ea]" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
            <div className="p-2" />
            {DAY_NAMES.map((day, i) => (
              <div key={i} className="p-2 text-center border-l border-[#e5e5ea]">
                <span className="hidden sm:block text-xs font-semibold text-[#3c3c43]">{day}</span>
                <span className="sm:hidden text-xs font-semibold text-[#3c3c43]">{DAY_SHORT[i]}</span>
              </div>
            ))}
          </div>

          {/* Grid body */}
          <div className="overflow-x-auto">
            <div className="grid min-w-[600px]" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
              {/* Time labels */}
              <div className="relative" style={{ height: TOTAL_H }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 text-[10px] text-[#c7c7cc] text-right pr-2 leading-none"
                    style={{ top: (h - START_HOUR) * PX_PER_HOUR - 5 }}
                  >
                    {h}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {DAY_NAMES.map((_, dayIdx) => {
                const dayNum = dayIdx + 1
                const dayActivities = filtered.filter((a) => a.dayOfWeek === dayNum)

                return (
                  <div
                    key={dayIdx}
                    className="relative border-l border-[#e5e5ea] cursor-pointer group"
                    style={{ height: TOTAL_H }}
                    onClick={() => setModal({ mode: "add", dayOfWeek: dayNum })}
                  >
                    {/* Hour grid lines */}
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-[#f2f2f7]"
                        style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
                      />
                    ))}

                    {/* Half-hour lines */}
                    {hours.map((h) => (
                      <div
                        key={`${h}.5`}
                        className="absolute left-0 right-0 border-t border-dashed border-[#f9f9f9]"
                        style={{ top: (h - START_HOUR) * PX_PER_HOUR + PX_PER_HOUR / 2 }}
                      />
                    ))}

                    {/* Add hint */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <div className="w-6 h-6 rounded-full bg-[#007aff]/10 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-[#007aff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>

                    {/* Activities */}
                    {dayActivities.map((activity) => {
                      const child = childMap.get(activity.childId)
                      const color = activity.color ?? child?.color ?? "#007aff"
                      const top = timeToY(activity.startTime)
                      const height = durationH(activity.startTime, activity.endTime)

                      return (
                        <div
                          key={activity.id}
                          className="absolute left-1 right-1 rounded-lg px-1.5 py-1 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                          style={{
                            top,
                            height,
                            backgroundColor: color + "25",
                            borderLeft: `3px solid ${color}`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setModal({ mode: "edit", activity })
                          }}
                        >
                          <p className="text-[10px] font-semibold leading-tight truncate" style={{ color }}>
                            {activity.name}
                          </p>
                          {height > 28 && (
                            <p className="text-[9px] leading-tight" style={{ color: color + "cc" }}>
                              {activity.startTime}–{activity.endTime}
                            </p>
                          )}
                          {height > 44 && activity.location && (
                            <p className="text-[9px] leading-tight truncate" style={{ color: color + "99" }}>
                              {activity.location}
                            </p>
                          )}
                          {height > 44 && child && children.length > 1 && (
                            <p className="text-[9px] leading-tight font-medium mt-0.5" style={{ color }}>
                              {child.name}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {modal.mode !== "closed" && (
        <ActivityModal
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
