import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      stops: {
        orderBy: { order: "asc" },
        include: { photos: { orderBy: { order: "asc" } } },
      },
    },
  })
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const exported = {
    title: trip.title,
    description: trip.description,
    startDate: trip.startDate.toISOString().split("T")[0],
    endDate: trip.endDate.toISOString().split("T")[0],
    country: trip.country,
    tripType: trip.tripType,
    participants: (() => { try { return JSON.parse(trip.participants) } catch { return [] } })(),
    tips: (() => { try { return JSON.parse(trip.tips ?? "null") } catch { return null } })(),
    coverPhoto: trip.coverPhoto,
    coverPhotoFocus: (() => { try { return JSON.parse(trip.coverPhotoFocus ?? "null") } catch { return null } })(),
    stops: trip.stops.map((stop) => ({
      title: stop.title,
      description: stop.description,
      date: stop.date ? stop.date.toISOString().split("T")[0] : null,
      lat: stop.lat,
      lng: stop.lng,
      order: stop.order,
      tags: (() => { try { return JSON.parse(stop.tags ?? "null") } catch { return null } })(),
      photos: stop.photos.map((p) => ({ url: p.url, caption: p.caption, order: p.order })),
    })),
  }

  return new NextResponse(JSON.stringify(exported, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${trip.slug}.json"`,
    },
  })
}
