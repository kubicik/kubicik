"use client"

import { useState, useEffect, useRef, KeyboardEvent } from "react"
import Image from "next/image"
import type { Stop } from "@/types"

// ── Inline markdown renderer ─────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|==[^=]+==[^=]?)/g).map((seg, i) => {
    if (seg.startsWith("**") && seg.endsWith("**"))
      return <strong key={i}>{seg.slice(2, -2)}</strong>
    if (seg.startsWith("*") && seg.endsWith("*"))
      return <em key={i}>{seg.slice(1, -1)}</em>
    if (seg.startsWith("==") && seg.endsWith("=="))
      return <mark key={i} className="bg-amber-100 text-amber-900 px-0.5 rounded not-italic">{seg.slice(2, -2)}</mark>
    return seg
  })
}

function renderMarkdown(text: string): React.ReactNode {
  if (!text.trim()) return <span className="text-[#c7c7cc] italic text-xs">Žádný popis</span>
  return text.split(/\n\n+/).map((para, pi) => {
    if (para.startsWith("> ")) {
      return (
        <blockquote key={pi} className="border-l-4 border-[#007aff] pl-3 my-2 italic text-[#6e6e73]">
          {renderInline(para.slice(2))}
        </blockquote>
      )
    }
    return (
      <p key={pi} className={pi > 0 ? "mt-2" : ""}>
        {para.split(/\n/).map((line, li, arr) => (
          <span key={li}>
            {renderInline(line)}
            {li < arr.length - 1 && <br />}
          </span>
        ))}
      </p>
    )
  })
}

// ── Tag chips ────────────────────────────────────────────────────────────────
interface Tag { emoji: string; label: string }

function parseTag(raw: string): Tag | null {
  const s = raw.trim()
  if (!s) return null
  const m = s.match(/^(\p{Extended_Pictographic}(?:️)?(?:‍\p{Extended_Pictographic}(?:️)?)*)\s*/u)
  if (m) return { emoji: m[1], label: s.slice(m[0].length).trim() }
  return { emoji: "·", label: s }
}

function TagChips({ value, onChange }: { value: Tag[]; onChange: (v: Tag[]) => void }) {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function add(raw: string) {
    const tag = parseTag(raw)
    if (tag && tag.label) onChange([...value, tag])
    setInput("")
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input) }
    else if (e.key === "Backspace" && input === "" && value.length > 0) onChange(value.slice(0, -1))
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 min-h-[40px] px-3 py-2 bg-[#f2f2f7] rounded-xl cursor-text focus-within:ring-2 focus-within:ring-[#007aff] transition-shadow"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, i) => (
        <span key={i} className="flex items-center gap-1 bg-white border border-[#e5e5ea] text-[#1d1d1f] text-xs px-2 py-0.5 rounded-full">
          <span>{tag.emoji}</span>
          <span>{tag.label}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(value.filter((_, j) => j !== i)) }}
            className="text-[#8e8e93] hover:text-[#ff3b30] transition-colors leading-none ml-0.5"
          >×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) add(input) }}
        placeholder={value.length === 0 ? "🛵 46 km na skútru, Enter…" : ""}
        className="flex-1 min-w-[160px] bg-transparent text-[#1d1d1f] text-xs outline-none placeholder:text-[#8e8e93]"
      />
    </div>
  )
}

// ── Section card wrapper ─────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-5 py-3 border-b border-[#f2f2f7]">
        <h4 className="text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">{title}</h4>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  stop: Stop | null
  isNew: boolean
  stopNumber: number
  latLng?: { lat: number; lng: number }
  onSave: (data: Partial<Stop>) => Promise<void>
  onDelete?: () => void
  onClose: () => void
  onAddPhoto?: (file: File) => Promise<void>
  onDeletePhoto?: (photoId: string) => void
}

function toDateInputValue(val: string | Date | null | undefined): string {
  if (!val) return ""
  const d = new Date(val)
  if (isNaN(d.getTime())) return ""
  return d.toISOString().split("T")[0]
}

function parseTags(raw: string | null): Tag[] {
  if (!raw) return []
  try { return JSON.parse(raw) as Tag[] }
  catch { return [] }
}

// ── Main form ────────────────────────────────────────────────────────────────
export default function StopForm({
  stop, isNew, stopNumber, latLng,
  onSave, onDelete, onClose,
  onAddPhoto, onDeletePhoto,
}: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [tags, setTags] = useState<Tag[]>([])
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [descTab, setDescTab] = useState<"edit" | "preview">("edit")

  useEffect(() => {
    if (stop) {
      setTitle(stop.title)
      setDescription(stop.description ?? "")
      setDate(toDateInputValue(stop.date))
      setTags(parseTags(stop.tags))
    } else {
      setTitle("")
      setDescription("")
      setDate("")
      setTags([])
    }
    setDescTab("edit")
  }, [stop?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title) return
    setSaving(true)
    await onSave({
      title,
      description: description || undefined,
      date: date || undefined,
      lat: stop?.lat,
      lng: stop?.lng,
      order: stop?.order,
      tags: tags.length > 0 ? JSON.stringify(tags) : undefined,
    })
    setSaving(false)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !onAddPhoto) return
    setUploadingPhoto(true)
    await onAddPhoto(file)
    setUploadingPhoto(false)
    e.target.value = ""
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-[#8e8e93] hover:text-[#1d1d1f] hover:bg-white rounded-xl transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#8e8e93]">
            {isNew ? "Nová zastávka" : `Zastávka ${stopNumber}`}
          </p>
          <p className="text-sm font-semibold text-[#1d1d1f] truncate">
            {isNew ? (latLng ? `${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)}` : "Vyberte místo na mapě") : stop?.title}
          </p>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center text-[#8e8e93] hover:text-[#ff3b30] hover:bg-[#fff2f0] rounded-xl transition-colors flex-shrink-0"
            title="Smazat zastávku"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Section: Základní informace */}
      <Section title="Základní informace">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#3a3a3c] mb-1.5">Název zastávky *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Název zastávky"
              className="w-full px-3 py-2 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#3a3a3c] mb-1.5">Datum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
            />
          </div>
        </div>
      </Section>

      {/* Section: Popis */}
      <Section title="Popis">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex rounded-lg bg-[#f2f2f7] p-0.5 gap-0.5">
              {(["edit", "preview"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDescTab(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    descTab === tab ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#8e8e93] hover:text-[#3a3a3c]"
                  }`}
                >
                  {tab === "edit" ? "Upravit" : "Náhled"}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-[#c7c7cc] font-mono">**tučně** · *kurzíva* · ==zvýraznění==</span>
          </div>

          {descTab === "edit" ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={"Co jsme tu dělali…\n\n> Citace nebo poznámka autora"}
              rows={12}
              className="w-full px-3 py-2 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow resize-y"
            />
          ) : (
            <div className="min-h-[196px] px-3 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm leading-relaxed">
              {renderMarkdown(description)}
            </div>
          )}
          <p className="text-[10px] text-[#8e8e93]">
            Prázdný řádek = odstavec · Řádek začínající <span className="font-mono">&gt;&nbsp;</span> = citace
          </p>
        </div>
      </Section>

      {/* Section: Tagy */}
      <Section title="Tagy dne">
        <TagChips value={tags} onChange={setTags} />
        <p className="text-[10px] text-[#8e8e93] mt-2">Emoji + popis, Enter přidá. Tagy se zobrazí na konci dne.</p>
      </Section>

      {/* Section: Fotografie (existing stops only) */}
      {!isNew && stop && (
        <Section title="Fotografie">
          <div className="space-y-3">
            {(stop.photos?.length ?? 0) > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {stop.photos!.map((photo) => (
                  <div key={photo.id} className="relative aspect-square group">
                    <Image
                      src={photo.url}
                      alt={photo.caption ?? ""}
                      fill
                      className="object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => onDeletePhoto?.(photo.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full items-center justify-center hidden group-hover:flex transition-opacity"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className={`flex items-center justify-center gap-2 h-11 border-2 border-dashed rounded-xl cursor-pointer text-sm transition-colors ${
              uploadingPhoto
                ? "border-[#007aff] bg-[#f0f6ff] text-[#007aff]"
                : "border-[#c7c7cc] text-[#8e8e93] hover:border-[#007aff] hover:text-[#007aff]"
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              {uploadingPhoto ? "Nahrávám…" : "Přidat fotografii"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
            </label>
          </div>
        </Section>
      )}

      {/* Section: GPS poloha */}
      {latLng && (
        <Section title="GPS poloha">
          <div className="flex items-center gap-2 text-sm text-[#3a3a3c]">
            <svg className="w-4 h-4 text-[#8e8e93] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-mono text-xs">
              {latLng.lat.toFixed(5)}, {latLng.lng.toFixed(5)}
            </span>
          </div>
          {!isNew && (
            <p className="text-[10px] text-[#8e8e93] mt-2">
              Pro přesun zastávky klikněte na nové místo na mapě.
            </p>
          )}
        </Section>
      )}

      {/* Save button */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 bg-[#007aff] text-white text-sm font-semibold rounded-2xl hover:bg-[#0066d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_10px_rgba(0,122,255,0.3)]"
      >
        {saving ? "Ukládám…" : isNew ? "Přidat zastávku" : "Uložit změny"}
      </button>
    </form>
  )
}
