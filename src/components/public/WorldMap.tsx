import dynamic from "next/dynamic"
import type { TripPin } from "./WorldMapInner"

const WorldMapInner = dynamic(() => import("./WorldMapInner"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#f2f2f7] animate-pulse rounded-2xl" />,
})

interface Props {
  trips: TripPin[]
  selectedTripId: string | null
  onTripClick: (trip: TripPin) => void
}

export default function WorldMap({ trips, selectedTripId, onTripClick }: Props) {
  return <WorldMapInner trips={trips} selectedTripId={selectedTripId} onTripClick={onTripClick} />
}
