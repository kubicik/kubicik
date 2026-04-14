"use client"

import { useEffect, useRef, useState } from "react"
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  Popup,
} from "react-leaflet"
import type { Icon, LeafletMouseEvent } from "leaflet"
import type { Stop } from "@/types"

// Registers the map click handler safely, guarding against the React 19
// timing issue where cleanup fires after the Leaflet map is already removed
// (which would throw "Cannot read properties of undefined (reading '_leaflet_events')").
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap()
  // Keep callback ref so we can change it without re-registering the listener
  const cbRef = useRef(onMapClick)
  cbRef.current = onMapClick

  useEffect(() => {
    function handleClick(e: LeafletMouseEvent) {
      cbRef.current(e.latlng.lat, e.latlng.lng)
    }
    map.on("click", handleClick)
    return () => {
      try {
        map.off("click", handleClick)
      } catch {
        // Map may already be removed — ignore cleanup errors
      }
    }
  }, [map]) // eslint-disable-line react-hooks/exhaustive-deps

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
  const defaultIconRef = useRef<Icon | null>(null)
  const selectedIconRef = useRef<Icon | null>(null)
  const [iconsReady, setIconsReady] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet") as typeof import("leaflet")

    // Fix default marker icons broken by Webpack/Next.js bundler
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: "/leaflet/marker-icon.png",
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      shadowUrl: "/leaflet/marker-shadow.png",
    })

    defaultIconRef.current = new L.Icon({
      iconUrl: "/leaflet/marker-icon.png",
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      shadowUrl: "/leaflet/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    selectedIconRef.current = new L.Icon({
      iconUrl: "/leaflet/marker-icon-2x.png",
      shadowUrl: "/leaflet/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    setIconsReady(true)
  }, [])

  const sorted = [...stops].sort((a, b) => a.order - b.order)
  const routePositions = sorted.map((s): [number, number] => [s.lat, s.lng])
  if (pendingLatLng) routePositions.push([pendingLatLng.lat, pendingLatLng.lng])

  const center: [number, number] =
    stops.length > 0 ? [stops[0].lat, stops[0].lng] : [42.0, 74.0]

  // Do not render MapContainer until icons are initialised — this prevents
  // Leaflet from accessing uninitialised icon state and the cascade that
  // triggers "_leaflet_events" errors in React 19 concurrent rendering.
  if (!iconsReady) {
    return <div style={{ height: "100%", width: "100%" }} className="bg-[#f2f2f7]" />
  }

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

      <MapClickHandler onMapClick={onMapClick} />

      {routePositions.length > 1 && (
        <Polyline positions={routePositions} color="#007aff" weight={2} opacity={0.7} dashArray="6,4" />
      )}

      {sorted.map((stop) => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={
            stop.id === selectedStopId
              ? selectedIconRef.current!
              : defaultIconRef.current!
          }
          eventHandlers={{
            click: (e) => {
              // Stop the click from reaching MapClickHandler
              ;(e as unknown as { originalEvent: Event }).originalEvent.stopPropagation()
              onMarkerClick(stop)
            },
          }}
        >
          <Popup>
            <strong>{stop.title}</strong>
            {stop.date && <><br />{new Date(stop.date).toLocaleDateString("cs-CZ")}</>}
          </Popup>
        </Marker>
      ))}

      {pendingLatLng && (
        <Marker
          position={[pendingLatLng.lat, pendingLatLng.lng]}
          icon={defaultIconRef.current!}
        >
          <Popup>Nová zastávka</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
