"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import type { Stop, Photo } from "@/types"
import StopForm from "./StopForm"
import { compressImage } from "@/lib/compressImage"

const StopMap = dynamic(() => import("./StopMap"), { ssr: false })

interface Props {
  tripId: string
  initialStops: Stop[]
}

export default function StopEditor({ tripId, initialStops }: Props) {
  const [stops, setStops] = useState<Stop[]>(initialStops)
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null)
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null)

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingLatLng({ lat, lng })
    setSelectedStop(null)
  }, [])

  const handleMarkerClick = useCallback((stop: Stop) => {
    setSelectedStop(stop)
    setPendingLatLng(null)
  }, [])

  async function handleSaveNew(data: Partial<Stop>) {
    if (!pendingLatLng) return
    const res = await fetch(`/api/trips/${tripId}/stops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        lat: pendingLatLng.lat,
        lng: pendingLatLng.lng,
        order: stops.length,
      }),
    })
    if (res.ok) {
      const newStop: Stop = await res.json()
      setStops((prev) => [...prev, newStop])
      setSelectedStop(newStop)
      setPendingLatLng(null)
    }
  }

  async function handleUpdateStop(stopId: string, data: Partial<Stop>) {
    const res = await fetch(`/api/trips/${tripId}/stops/${stopId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated: Stop = await res.json()
      setStops((prev) => prev.map((s) => (s.id === stopId ? updated : s)))
      setSelectedStop(updated)
    }
  }

  async function handleDeleteStop(stopId: string) {
    if (!confirm("Smazat tuto zastávku?")) return
    const res = await fetch(`/api/trips/${tripId}/stops/${stopId}`, { method: "DELETE" })
    if (res.ok) {
      setStops((prev) => prev.filter((s) => s.id !== stopId))
      setSelectedStop(null)
    }
  }

  async function handleAddPhoto(stopId: string, file: File) {
    let toUpload: File
    try {
      toUpload = await compressImage(file, "stops")
    } catch {
      toUpload = file
    }
    const fd = new FormData()
    fd.append("file", toUpload)
    fd.append("type", "stops")
    const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
    const { url } = await uploadRes.json()
    if (!url) return

    const photoRes = await fetch(`/api/trips/${tripId}/stops/${stopId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, order: (selectedStop?.photos?.length ?? 0) }),
    })
    if (photoRes.ok) {
      const photo: Photo = await photoRes.json()
      setStops((prev) =>
        prev.map((s) => s.id === stopId ? { ...s, photos: [...(s.photos ?? []), photo] } : s)
      )
      setSelectedStop((prev) =>
        prev?.id === stopId ? { ...prev, photos: [...(prev.photos ?? []), photo] } : prev
      )
    }
  }

  async function handleDeletePhoto(stopId: string, photoId: string) {
    const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" })
    if (res.ok) {
      setStops((prev) =>
        prev.map((s) =>
          s.id === stopId ? { ...s, photos: (s.photos ?? []).filter((p) => p.id !== photoId) } : s
        )
      )
      setSelectedStop((prev) =>
        prev?.id === stopId
          ? { ...prev, photos: (prev.photos ?? []).filter((p) => p.id !== photoId) }
          : prev
      )
    }
  }

  function handleClose() {
    setSelectedStop(null)
    setPendingLatLng(null)
  }

  const sortedStops = [...stops].sort((a, b) => a.order - b.order)
  const isEditing = !!(pendingLatLng || selectedStop)
  const stopNumber = selectedStop
    ? sortedStops.findIndex((s) => s.id === selectedStop.id) + 1
    : sortedStops.length + 1

  return (
    <div className="flex gap-6 h-[calc(100vh-160px)]">
      {/* Map */}
      <div className="flex-1 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.08)] relative">
        <StopMap
          stops={stops}
          pendingLatLng={pendingLatLng}
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          selectedStopId={selectedStop?.id}
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
          Klikněte na mapu pro přidání zastávky
        </div>
      </div>

      {/* Side panel — either stop list or stop editor, never both */}
      <div className="w-[420px] overflow-y-auto flex flex-col gap-4">
        {isEditing ? (
          <StopForm
            stop={selectedStop}
            isNew={!!pendingLatLng}
            stopNumber={stopNumber}
            latLng={pendingLatLng ?? (selectedStop ? { lat: selectedStop.lat, lng: selectedStop.lng } : undefined)}
            onSave={pendingLatLng ? handleSaveNew : (data) => handleUpdateStop(selectedStop!.id, data)}
            onDelete={selectedStop ? () => handleDeleteStop(selectedStop.id) : undefined}
            onClose={handleClose}
            onAddPhoto={selectedStop ? (f) => handleAddPhoto(selectedStop.id, f) : undefined}
            onDeletePhoto={selectedStop ? (pId) => handleDeletePhoto(selectedStop.id, pId) : undefined}
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5ea]">
              <h3 className="font-semibold text-[#1d1d1f] text-sm">
                Zastávky
                <span className="ml-2 text-[#8e8e93] font-normal">{stops.length}</span>
              </h3>
            </div>
            {sortedStops.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-[#f2f2f7] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-[#c7c7cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-[#8e8e93]">Žádné zastávky</p>
                <p className="text-xs text-[#c7c7cc] mt-1">Klikněte na mapu pro přidání</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f2f2f7]">
                {sortedStops.map((stop, i) => (
                  <button
                    key={stop.id}
                    onClick={() => { setSelectedStop(stop); setPendingLatLng(null) }}
                    className="w-full text-left px-5 py-3.5 flex items-start gap-3 hover:bg-[#f9f9f9] transition-colors"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#007aff] text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1d1d1f] truncate">{stop.title}</p>
                      <p className="text-xs text-[#8e8e93] mt-0.5 flex items-center gap-2">
                        {stop.date && <span>{new Date(stop.date).toLocaleDateString("cs-CZ")}</span>}
                        {(stop.photos?.length ?? 0) > 0 && (
                          <span className="flex items-center gap-0.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {stop.photos!.length}
                          </span>
                        )}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-[#c7c7cc] flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
