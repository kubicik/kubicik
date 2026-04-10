"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet"
import type { Stop } from "@/types"

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

function getBounds(stops: Stop[]): [[number, number], [number, number]] | undefined {
  if (stops.length === 0) return undefined
  const lats = stops.map((s) => s.lat)
  const lngs = stops.map((s) => s.lng)
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}

export default function TripMapInner({ stops }: { stops: Stop[] }) {
  useEffect(() => {
    fixLeafletIcons()
  }, [])

  const sorted = [...stops].sort((a, b) => a.order - b.order)
  const routePositions: [number, number][] = sorted.map((s) => [s.lat, s.lng])
  const bounds = getBounds(sorted)
  const center: [number, number] = sorted.length > 0 ? [sorted[0].lat, sorted[0].lng] : [42, 74]

  return (
    <MapContainer
      center={center}
      zoom={stops.length === 1 ? 10 : 6}
      bounds={bounds}
      boundsOptions={{ padding: [40, 40] }}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {routePositions.length > 1 && (
        <Polyline positions={routePositions} color="#007aff" weight={3} opacity={0.8} />
      )}

      {sorted.map((stop, idx) => (
        <Marker key={stop.id} position={[stop.lat, stop.lng]}>
          <Popup>
            <div>
              <strong>{idx + 1}. {stop.title}</strong>
              {stop.date && <><br /><span>{new Date(stop.date).toLocaleDateString("cs-CZ")}</span></>}
              {stop.description && <><br /><span>{stop.description}</span></>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
