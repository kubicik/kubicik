"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet"

export interface TripPin {
  id: string
  slug: string
  title: string
  year: number
  country: string | null
  lat: number
  lng: number
}

function BoundsFitter({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) return
    if (positions.length === 1) {
      map.setView(positions[0], 5, { animate: false })
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet") as typeof import("leaflet")
    map.fitBounds(L.latLngBounds(positions), { padding: [60, 60], maxZoom: 8, animate: false })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

interface Props {
  trips: TripPin[]
  selectedTripId: string | null
  onTripClick: (trip: TripPin) => void
}

export default function WorldMapInner({ trips, selectedTripId, onTripClick }: Props) {
  const positions = trips.map((t): [number, number] => [t.lat, t.lng])
  const center: [number, number] = positions[0] ?? [20, 10]

  return (
    <MapContainer
      center={center}
      zoom={2}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
      zoomControl={true}
      attributionControl={false}
    >
      {/* CartoDB Positron — light, clean, no labels clutter */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />

      {trips.map((trip) => (
        <CircleMarker
          key={trip.id}
          center={[trip.lat, trip.lng]}
          radius={selectedTripId === trip.id ? 10 : 7}
          pathOptions={{
            color: selectedTripId === trip.id ? "#007aff" : "#1d1d1f",
            fillColor: selectedTripId === trip.id ? "#007aff" : "#1d1d1f",
            fillOpacity: 1,
            weight: selectedTripId === trip.id ? 3 : 0,
          }}
          eventHandlers={{ click: () => onTripClick(trip) }}
        >
          <Popup>
            <span className="text-xs font-semibold">{trip.title}</span>
            <br />
            <span className="text-xs text-gray-500">{trip.country ?? ""} · {trip.year}</span>
          </Popup>
        </CircleMarker>
      ))}

      <BoundsFitter positions={positions} />
    </MapContainer>
  )
}
