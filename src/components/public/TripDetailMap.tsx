"use client"

import dynamic from "next/dynamic"
import type { Stop } from "@/types"

const TripMapInner = dynamic(() => import("./TripMapInner"), { ssr: false })

export default function TripDetailMap({ stops }: { stops: Stop[] }) {
  return <TripMapInner stops={stops} />
}
