"use client"

import { useEffect } from "react"
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
  Popup,
} from "react-leaflet"
import type L from "leaflet"
import type { Stop } from "@/types"

// Fix Leaflet default marker icon
function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet") as typeof import("leaflet")
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl: "/leaflet/marker-icon.png",
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  })
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface Props {
  stops: Stop[]
  pendingLatLng: { lat: number; lng: number } | null
  onMapClick: (lat: number, lng: number) => void
  onMarkerClick: (stop: Stop) => void
  selectedStopId?: string
}

export default function StopMap({
  stops,
  pendingLatLng,
  onMapClick,
  onMarkerClick,
  selectedStopId,
}: Props) {
  useEffect(() => {
    fixLeafletIcons()
  }, [])

  const sorted = [...stops].sort((a, b) => a.order - b.order)
  const routePositions = sorted.map((s): [number, number] => [s.lat, s.lng])
  if (pendingLatLng) routePositions.push([pendingLatLng.lat, pendingLatLng.lng])

  // Center: use first stop or central Asia default
  const center: [number, number] =
    stops.length > 0 ? [stops[0].lat, stops[0].lng] : [42.0, 74.0]

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet") as typeof import("leaflet")

  const selectedIcon = new L.Icon({
    iconUrl: "/leaflet/marker-icon-2x.png",
    shadowUrl: "/leaflet/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  return (
    <MapContainer
      center={center}
      zoom={stops.length > 0 ? 6 : 5}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />

      {routePositions.length > 1 && (
        <Polyline positions={routePositions} color="#007aff" weight={2} opacity={0.7} dashArray="6,4" />
      )}

      {sorted.map((stop) => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={stop.id === selectedStopId ? selectedIcon : undefined}
          eventHandlers={{ click: () => onMarkerClick(stop) }}
        >
          <Popup>
            <strong>{stop.title}</strong>
            {stop.date && <><br />{new Date(stop.date).toLocaleDateString("cs-CZ")}</>}
          </Popup>
        </Marker>
      ))}

      {pendingLatLng && (
        <Marker position={[pendingLatLng.lat, pendingLatLng.lng]}>
          <Popup>Nová zastávka</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
