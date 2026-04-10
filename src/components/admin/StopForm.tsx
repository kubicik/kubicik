"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import type { Stop } from "@/types"

interface Props {
  stop: Stop | null
  isNew: boolean
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

export default function StopForm({
  stop,
  isNew,
  onSave,
  onDelete,
  onClose,
  onAddPhoto,
  onDeletePhoto,
}: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    if (stop) {
      setTitle(stop.title)
      setDescription(stop.description ?? "")
      setDate(toDateInputValue(stop.date))
    } else {
      setTitle("")
      setDescription("")
      setDate("")
    }
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
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5ea]">
        <h3 className="font-semibold text-[#1d1d1f] text-sm">
          {isNew ? "Nová zastávka" : "Upravit zastávku"}
        </h3>
        <button onClick={onClose} className="text-[#8e8e93] hover:text-[#1d1d1f] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Název zastávky *"
            className="w-full px-3 py-2 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
          />
        </div>
        <div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow"
          />
        </div>
        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Co jsme tu dělali..."
            rows={3}
            className="w-full px-3 py-2 bg-[#f2f2f7] rounded-xl text-[#1d1d1f] text-sm focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-shadow resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] transition-colors disabled:opacity-50"
          >
            {saving ? "Ukládám..." : isNew ? "Přidat zastávku" : "Uložit"}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-2 text-[#ff3b30] hover:bg-[#fff2f0] rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Photos (only for existing stops) */}
      {!isNew && stop && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs font-medium text-[#8e8e93] uppercase tracking-wide">Fotografie</p>
          {(stop.photos?.length ?? 0) > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {stop.photos!.map((photo) => (
                <div key={photo.id} className="relative aspect-square group">
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    fill
                    className="object-cover rounded-lg"
                  />
                  <button
                    onClick={() => onDeletePhoto?.(photo.id)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full items-center justify-center hidden group-hover:flex transition-opacity"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className={`flex items-center justify-center gap-2 h-10 border-2 border-dashed rounded-xl cursor-pointer text-sm transition-colors ${
            uploadingPhoto ? "border-[#007aff] bg-[#f0f6ff] text-[#007aff]" : "border-[#c7c7cc] text-[#8e8e93] hover:border-[#007aff] hover:text-[#007aff]"
          }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            {uploadingPhoto ? "Nahrávám..." : "Přidat fotku"}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
          </label>
        </div>
      )}
    </div>
  )
}
