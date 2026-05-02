"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from "react-leaflet"
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
    map.fitBounds(L.latLngBounds(positions), { padding: [40, 40], animate: false })
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

function makeNumberedIcon(
  L: typeof import("leaflet"),
  num: number,
  isSelected: boolean,
) {
  const size = isSelected ? 34 : 28
  const half = size / 2
  const bg = isSelected ? "#007aff" : "#ffffff"
  const fg = isSelected ? "#ffffff" : "#007aff"
  const border = isSelected ? "2.5px solid #ffffff" : "2px solid #007aff"
  const shadow = isSelected
    ? "0 0 0 2px #007aff, 0 3px 10px rgba(0,122,255,0.4)"
    : "0 1px 5px rgba(0,0,0,0.22)"
  const fontSize = isSelected ? 13 : 11

  return new L.DivIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:${border};box-shadow:${shadow};display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:${fontSize}px;font-weight:700;color:${fg}">${num}</div>`,
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -(half + 4)],
  })
}

interface Props {
  stops: Stop[]
  selectedStopId: string | null
  onStopSelect: (stop: Stop) => void
}

export default function TripMapGalleryInner({ stops, selectedStopId, onStopSelect }: Props) {
  const leafletRef = useRef<typeof import("leaflet") | null>(null)
  const [iconsReady, setIconsReady] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet") as typeof import("leaflet")
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: "/leaflet/marker-icon.png",
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      shadowUrl: "/leaflet/marker-shadow.png",
    })
    leafletRef.current = L
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

      {iconsReady && leafletRef.current && sorted.map((stop, idx) => {
        const isSelected = stop.id === selectedStopId
        return (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={makeNumberedIcon(leafletRef.current!, idx + 1, isSelected)}
            eventHandlers={{ click: () => onStopSelect(stop) }}
            zIndexOffset={isSelected ? 1000 : 0}
          >
            <Popup offset={[0, isSelected ? -21 : -18]}>
              <span className="text-xs font-medium">{idx + 1}. {stop.title}</span>
            </Popup>
          </Marker>
        )
      })}

      <BoundsFitter positions={routePositions} />
      <MapPanner stop={selectedStop} />
    </MapContainer>
  )
}
