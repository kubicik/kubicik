"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

const TRIP_TYPES = [
  { value: "roadtrip", label: "Roadtrip" },
  { value: "trekking", label: "Trekking" },
  { value: "město", label: "Město" },
  { value: "dobrodružství", label: "Dobrodružství" },
]

interface TripData {
  id?: string
  title: string
  description: string
  startDate: string
  endDate: string
  coverPhoto: string
  participants: string[]
  published: boolean
  country: string
  tripType: string
  tips: { logistika: string[]; pozor: string[] }
}

interface Props {
  initial?: Partial<TripData>
}

function toDateInput(val: string | Date | undefined): string {
  if (!val) return ""
  const d = new Date(val)
  if (isNaN(d.getTime())) return ""
  return d.toISOString().split("T")[0]
}

function parseTips(raw: string): { logistika: string[]; pozor: string[] } {
  try {
    const parsed = JSON.parse(raw)
    return {
      logistika: Array.isArray(parsed.logistika) ? parsed.logistika : [],
      pozor: Array.isArray(parsed.pozor) ? parsed.pozor : [],
    }
  } catch {
    return { logistika: [], pozor: [] }
  }
}

export default function TripForm({ initial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadingCover, setUploadingCover] = useState(false)

  const [title, setTitle] = useState(initial?.title ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [startDate, setStartDate] = useState(toDateInput(initial?.startDate))
  const [endDate, setEndDate] = useState(toDateInput(initial?.endDate))
  const [coverPhoto, setCoverPhoto] = useState(initial?.coverPhoto ?? "")
  const [participantsStr, setParticipantsStr] = useState(
    (initial?.participants ?? []).join(", ")
  )
  const [published, setPublished] = useState(initial?.published ?? false)
  const [country, setCountry] = useState(initial?.country ?? "")
  const [tripType, setTripType] = useState(initial?.tripType ?? "")
  const [tipsLogistika, setTipsLogistika] = useState(
    (initial?.tips?.logistika ?? []).join("\n")
  )
  const [tipsPozor, setTipsPozor] = useState(
    (initial?.tips?.pozor ?? []).join("\n")
  )

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("type", "covers")
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (data.url) setCoverPhoto(data.url)
    setUploadingCover(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const participants = participantsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const logistika = tipsLogistika.split("\n").map((s) => s.trim()).filter(Boolean)
    const pozor = tipsPozor.split("\n").map((s) => s.trim()).filter(Boolean)
    const tips = (logistika.length > 0 || pozor.length > 0)
      ? JSON.stringify({ logistika, pozor })
      : null

    const payload = {
      title,
      description,
      startDate,
      endDate,
      coverPhoto,
      participants,
      published,
      country: country || null,
      tripType: tripType || null,
      tips,
    }

    const url = initial?.id ? `/api/trips/${initial.id}` : "/api/trips"
    const method = initial?.id ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Chyba při ukládání")
      return
    }

    const trip = await res.json()
    router.push(`/admin/trips/${trip.id}/stops`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-[#fff2f2] border border-[#ffcdd2] text-[#c62828] text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 space-y-4">
        <h2 className="text-sm font-medium text-[#8e8e93] uppercase tracking-wide">Základní informace</h2>
        <div>
          <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Název výletu *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Kyrgyzstán 2025"
            className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Popis</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Krátký popis výletu..."
            className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Země</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Kyrgyzstán"
              className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Typ výletu</label>
            <select
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
            >
              <option value="">— vyberte —</option>
              {TRIP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 space-y-4">
        <h2 className="text-sm font-medium text-[#8e8e93] uppercase tracking-wide">Termín</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Od *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Do *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
            />
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 space-y-4">
        <h2 className="text-sm font-medium text-[#8e8e93] uppercase tracking-wide">Účastníci</h2>
        <div>
          <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
            Jména <span className="text-[#8e8e93] font-normal">(oddělené čárkou)</span>
          </label>
          <input
            value={participantsStr}
            onChange={(e) => setParticipantsStr(e.target.value)}
            placeholder="Zbyněk, Jana, Petr"
            className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
          />
        </div>
      </div>

      {/* Cover photo */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 space-y-4">
        <h2 className="text-sm font-medium text-[#8e8e93] uppercase tracking-wide">Titulní fotografie</h2>
        {coverPhoto && (
          <div className="relative w-full h-48 rounded-xl overflow-hidden">
            <Image src={coverPhoto} alt="Cover" fill className="object-cover" />
            <button
              type="button"
              onClick={() => setCoverPhoto("")}
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <label className={`flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          uploadingCover ? "border-[#007aff] bg-[#f0f6ff]" : "border-[#c7c7cc] hover:border-[#007aff] hover:bg-[#f9f9f9]"
        }`}>
          <svg className="w-6 h-6 text-[#8e8e93]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[#8e8e93] text-sm">
            {uploadingCover ? "Nahrávám..." : "Klikněte pro výběr fotografie"}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
        </label>
      </div>

      {/* Tips */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6 space-y-4">
        <h2 className="text-sm font-medium text-[#8e8e93] uppercase tracking-wide">Praktické tipy</h2>
        <p className="text-xs text-[#8e8e93]">Každý tip na samostatném řádku.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Logistika</label>
            <textarea
              value={tipsLogistika}
              onChange={(e) => setTipsLogistika(e.target.value)}
              rows={5}
              placeholder={"Letiště Manas je 30 km od Biškeku\nVíza on-arrival pro EU"}
              className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Na co si dát pozor</label>
            <textarea
              value={tipsPozor}
              onChange={(e) => setTipsPozor(e.target.value)}
              rows={5}
              placeholder={"Výšková nemoc nad 3 000 m\nHotovost — karty málokde"}
              className="w-full px-4 py-2.5 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow resize-none"
            />
          </div>
        </div>
      </div>

      {/* Published */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-6">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="font-medium text-[#1d1d1f] text-sm">Publikovat výlet</p>
            <p className="text-[#8e8e93] text-xs mt-0.5">Výlet bude viditelný na veřejném webu</p>
          </div>
          <div
            onClick={() => setPublished(!published)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${published ? "bg-[#34c759]" : "bg-[#e5e5ea]"}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${published ? "translate-x-5.5" : "translate-x-0.5"}`} />
          </div>
        </label>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-[#007aff] text-sm font-medium hover:bg-[#f0f6ff] rounded-xl transition-colors"
        >
          Zrušit
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Ukládám..." : initial?.id ? "Uložit změny" : "Vytvořit výlet"}
        </button>
      </div>
    </form>
  )
}
