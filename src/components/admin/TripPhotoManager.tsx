"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { compressImage } from "@/lib/compressImage"
import type { TripPhoto } from "@/types"

interface StopRef {
  id: string
  title: string
  order: number
}

interface Props {
  tripId: string
  stops: StopRef[]
  initialPhotos: TripPhoto[]
}

function PhotoPreviewModal({ url, caption, onClose }: { url: string; caption: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt={caption || "Náhled fotky"}
          className="w-full h-full object-contain max-h-[85vh] rounded-xl"
        />
        {caption && (
          <p className="mt-2 text-center text-white/80 text-sm">{caption}</p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-white text-[#1d1d1f] rounded-full flex items-center justify-center shadow-lg hover:bg-[#f2f2f7] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

interface PhotoCardProps {
  photo: TripPhoto
  stops: StopRef[]
  onUpdate: (id: string, patch: Partial<Pick<TripPhoto, "isDrone" | "stopId" | "caption">>) => void
  onDelete: (id: string) => void
}

function PhotoCard({ photo, stops, onUpdate, onDelete }: PhotoCardProps) {
  const [caption, setCaption] = useState(photo.caption ?? "")
  const [preview, setPreview] = useState(false)
  const sortedStops = [...stops].sort((a, b) => a.order - b.order)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#e5e5ea] overflow-hidden">
      <div className="relative aspect-[4/3] bg-[#f2f2f7] cursor-zoom-in" onClick={() => setPreview(true)}>
        <Image src={photo.url} alt={caption || "Fotka výletu"} fill className="object-cover" sizes="220px" />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(photo.id) }}
          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
          title="Smazat fotku"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {photo.isDrone && (
          <span className="absolute top-1.5 left-1.5 bg-amber-400/90 text-amber-900 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
            🚁 Dron
          </span>
        )}
      </div>
      {preview && (
        <PhotoPreviewModal url={photo.url} caption={caption} onClose={() => setPreview(false)} />
      )}
      <div className="p-2 space-y-1.5">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => {
            const next = caption.trim() || null
            if (next !== photo.caption) onUpdate(photo.id, { caption: next })
          }}
          placeholder="Popis…"
          className="w-full text-xs text-[#3a3a3c] bg-[#f2f2f7] rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-[#007aff]"
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onUpdate(photo.id, { isDrone: !photo.isDrone })}
            className={`flex-shrink-0 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
              photo.isDrone
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-[#f2f2f7] text-[#8e8e93] hover:bg-[#e5e5ea]"
            }`}
          >
            🚁
          </button>
          <select
            value={photo.stopId ?? ""}
            onChange={(e) => onUpdate(photo.id, { stopId: e.target.value || null })}
            className="flex-1 min-w-0 text-[11px] text-[#3a3a3c] bg-[#f2f2f7] rounded-lg px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-[#007aff]"
          >
            <option value="">Bez zastávky</option>
            {sortedStops.map((s, i) => (
              <option key={s.id} value={s.id}>
                {i + 1}. {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

interface ColumnProps {
  title: string
  count: number
  accent: "amber" | "gray" | "green"
  children: React.ReactNode
}

function Column({ title, count, accent, children }: ColumnProps) {
  const bg = {
    amber: "bg-amber-50 border-amber-200",
    gray: "bg-[#f9f9fb] border-[#e5e5ea]",
    green: "bg-[#f0faf4] border-[#c7e8d4]",
  }[accent]

  return (
    <div className={`w-52 flex-shrink-0 rounded-2xl border ${bg} p-3 flex flex-col`}>
      <div className="text-xs font-semibold text-[#3a3a3c] mb-2.5 px-0.5 truncate">
        {title}{" "}
        <span className="text-[#aeaeb2] font-normal">({count})</span>
      </div>
      <div className="space-y-2 flex-1">
        {children}
      </div>
    </div>
  )
}

export default function TripPhotoManager({ tripId, stops, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<TripPhoto[]>(initialPhotos)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (!files.length) return
    setUploadProgress({ done: 0, total: files.length })
    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i], "trips")
        const fd = new FormData()
        fd.append("file", compressed)
        fd.append("type", "trips")
        const upRes = await fetch("/api/upload", { method: "POST", body: fd })
        const { url } = await upRes.json()
        const saveRes = await fetch(`/api/trips/${tripId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        })
        const photo = (await saveRes.json()) as TripPhoto
        setPhotos((prev) => [...prev, photo])
      } catch (err) {
        console.error("Upload error:", err)
      }
      setUploadProgress({ done: i + 1, total: files.length })
    }
    setUploadProgress(null)
  }

  async function handleUpdate(
    photoId: string,
    patch: Partial<Pick<TripPhoto, "isDrone" | "stopId" | "caption">>
  ) {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, ...patch } : p)))
    await fetch(`/api/trips/${tripId}/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
  }

  async function handleDelete(photoId: string) {
    if (!confirm("Smazat fotku?")) return
    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    await fetch(`/api/trips/${tripId}/photos/${photoId}`, { method: "DELETE" })
  }

  const sortedStops = [...stops].sort((a, b) => a.order - b.order)
  const dronePhotos = photos.filter((p) => p.isDrone)
  const unassigned = photos.filter((p) => !p.isDrone && !p.stopId)

  return (
    <div>
      {/* Upload toolbar */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFiles}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!!uploadProgress}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066dd] disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploadProgress
            ? `Nahrávám ${uploadProgress.done}/${uploadProgress.total}…`
            : "Nahrát fotky"}
        </button>
        {photos.length > 0 && (
          <span className="text-sm text-[#8e8e93]">
            {photos.length}{" "}
            {photos.length === 1 ? "fotka" : photos.length < 5 ? "fotky" : "fotek"} celkem
          </span>
        )}
      </div>

      {photos.length === 0 && !uploadProgress && (
        <div className="text-center py-16 text-[#aeaeb2] text-sm">
          Zatím žádné fotky. Klikněte na „Nahrát fotky" a přidejte první.
        </div>
      )}

      {photos.length > 0 && (
        <>
          <p className="text-xs text-[#aeaeb2] mb-4">
            🚁 tlačítko označí fotku jako dronovou (zobrazí se ve vlastní sekci na webu) · výběr zastávky slouží k evidenci přiřazení
          </p>
          {/* Column layout */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max items-start">
              {/* Drone column */}
              <Column title="🚁 Dronové fotky" count={dronePhotos.length} accent="amber">
                {dronePhotos.length === 0 ? (
                  <p className="text-xs text-[#aeaeb2] text-center py-4">Žádné</p>
                ) : (
                  dronePhotos.map((p) => (
                    <PhotoCard
                      key={p.id}
                      photo={p}
                      stops={sortedStops}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </Column>

              {/* Divider */}
              <div className="w-px self-stretch bg-[#e5e5ea] mx-1 flex-shrink-0" />

              {/* Unassigned column */}
              <Column title="Bez zastávky" count={unassigned.length} accent="gray">
                {unassigned.length === 0 ? (
                  <p className="text-xs text-[#aeaeb2] text-center py-4">Žádné</p>
                ) : (
                  unassigned.map((p) => (
                    <PhotoCard
                      key={p.id}
                      photo={p}
                      stops={sortedStops}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </Column>

              {/* Per-stop columns */}
              {sortedStops.map((stop, i) => {
                const stopPhotos = photos.filter((p) => !p.isDrone && p.stopId === stop.id)
                return (
                  <Column
                    key={stop.id}
                    title={`${i + 1}. ${stop.title}`}
                    count={stopPhotos.length}
                    accent="green"
                  >
                    {stopPhotos.length === 0 ? (
                      <p className="text-xs text-[#aeaeb2] text-center py-4">Žádné</p>
                    ) : (
                      stopPhotos.map((p) => (
                        <PhotoCard
                          key={p.id}
                          photo={p}
                          stops={sortedStops}
                          onUpdate={handleUpdate}
                          onDelete={handleDelete}
                        />
                      ))
                    )}
                  </Column>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
