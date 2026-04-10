"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import type { Stop, Photo } from "@/types"
import StopForm from "./StopForm"

const StopMap = dynamic(() => import("./StopMap"), { ssr: false })

interface Props {
  tripId: string
  initialStops: Stop[]
}

export default function StopEditor({ tripId, initialStops }: Props) {
  const [stops, setStops] = useState<Stop[]>(initialStops)
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null)
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null)

  // Called when user clicks on the map (new stop)
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingLatLng({ lat, lng })
    setSelectedStop(null)
  }, [])

  // Called when user clicks an existing marker
  const handleMarkerClick = useCallback(
    (stop: Stop) => {
      setSelectedStop(stop)
      setPendingLatLng(null)
    },
    []
  )

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
    const fd = new FormData()
    fd.append("file", file)
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
        prev.map((s) =>
          s.id === stopId ? { ...s, photos: [...(s.photos ?? []), photo] } : s
        )
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
          s.id === stopId
            ? { ...s, photos: (s.photos ?? []).filter((p) => p.id !== photoId) }
            : s
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

      {/* Side panel */}
      <div className="w-80 flex flex-col gap-4 overflow-y-auto">
        {/* Stop form (new or edit) */}
        {(pendingLatLng || selectedStop) && (
          <StopForm
            stop={selectedStop}
            isNew={!!pendingLatLng}
            onSave={pendingLatLng ? handleSaveNew : (data) => handleUpdateStop(selectedStop!.id, data)}
            onDelete={selectedStop ? () => handleDeleteStop(selectedStop.id) : undefined}
            onClose={handleClose}
            onAddPhoto={selectedStop ? (f) => handleAddPhoto(selectedStop.id, f) : undefined}
            onDeletePhoto={selectedStop ? (pId) => handleDeletePhoto(selectedStop.id, pId) : undefined}
          />
        )}

        {/* Stop list */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e5e5ea]">
            <h3 className="font-semibold text-[#1d1d1f] text-sm">
              Zastávky ({stops.length})
            </h3>
          </div>
          {stops.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[#8e8e93] text-center">
              Klikněte na mapu pro přidání zastávky
            </p>
          ) : (
            <div className="divide-y divide-[#e5e5ea]">
              {[...stops].sort((a, b) => a.order - b.order).map((stop, i) => (
                <button
                  key={stop.id}
                  onClick={() => { setSelectedStop(stop); setPendingLatLng(null) }}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                    selectedStop?.id === stop.id ? "bg-[#f0f6ff]" : "hover:bg-[#f9f9f9]"
                  }`}
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#007aff] text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1d1d1f] truncate">{stop.title}</p>
                    {stop.date && (
                      <p className="text-xs text-[#8e8e93] mt-0.5">
                        {new Date(stop.date).toLocaleDateString("cs-CZ")}
                      </p>
                    )}
                    {(stop.photos?.length ?? 0) > 0 && (
                      <p className="text-xs text-[#8e8e93]">{stop.photos!.length} fotek</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
