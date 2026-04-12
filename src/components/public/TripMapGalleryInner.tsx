"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from "react-leaflet"
import type { Icon, Map as LeafletMap } from "leaflet"
import type { Stop } from "@/types"

// Fit all stops into view on first load
function BoundsFitter({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) return
    if (positions.length === 1) {
      map.setView(positions[0], 12)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet") as typeof import("leaflet")
    const bounds = L.latLngBounds(positions)
    map.fitBounds(bounds, { padding: [40, 40], animate: false })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// Pan map to selected stop
function MapPanner({ stop }: { stop: Stop | null }) {
  const map = useMap()
  useEffect(() => {
    if (stop) map.panTo([stop.lat, stop.lng], { animate: true, duration: 0.5 })
  }, [stop, map])
  return null
}

interface Props {
  stops: Stop[]
  selectedStopId: string | null
  onStopSelect: (stop: Stop) => void
}

export default function TripMapGalleryInner({ stops, selectedStopId, onStopSelect }: Props) {
  const defaultIconRef = useRef<Icon | null>(null)
  const selectedIconRef = useRef<Icon | null>(null)
  const [iconsReady, setIconsReady] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet") as typeof import("leaflet")
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl

    defaultIconRef.current = new L.Icon({
      iconUrl: "/leaflet/marker-icon.png",
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      shadowUrl: "/leaflet/marker-shadow.png",
      iconSize: [20, 32],
      iconAnchor: [10, 32],
      popupAnchor: [0, -32],
      shadowSize: [32, 32],
    })

    selectedIconRef.current = new L.Icon({
      iconUrl: "/leaflet/marker-icon-2x.png",
      shadowUrl: "/leaflet/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [0, -41],
      shadowSize: [41, 41],
    })

    setIconsReady(true)
  }, [])

  const sorted = [...stops].sort((a, b) => a.order - b.order)
  const routePositions = sorted.map((s): [number, number] => [s.lat, s.lng])
  const center: [number, number] = sorted.length > 0 ? [sorted[0].lat, sorted[0].lng] : [42, 74]
  const selectedStop = sorted.find((s) => s.id === selectedStopId) ?? null

  return (
    <MapContainer
      center={center}
      zoom={3}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {routePositions.length > 1 && (
        <Polyline positions={routePositions} color="#1d1d1f" weight={1.5} opacity={0.35} />
      )}

      {iconsReady && sorted.map((stop, idx) => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={stop.id === selectedStopId ? selectedIconRef.current! : defaultIconRef.current!}
          eventHandlers={{ click: () => onStopSelect(stop) }}
          zIndexOffset={stop.id === selectedStopId ? 1000 : 0}
        >
          <Popup offset={[0, stop.id === selectedStopId ? -41 : -32]}>
            <span className="text-xs font-medium">{idx + 1}. {stop.title}</span>
          </Popup>
        </Marker>
      ))}

      <BoundsFitter positions={routePositions} />
      <MapPanner stop={selectedStop} />
    </MapContainer>
  )
}
