import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const {
    preview = false,
    title, description, startDate, endDate,
    country, tripType, participants, tips,
    coverPhoto, coverPhotoFocus,
    stops: stopsFromJson = [],
  } = body

  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: "Chybí povinná pole: title, startDate, endDate" }, { status: 400 })
  }

  const existingTrip = await prisma.trip.findUnique({
    where: { id },
    include: { stops: true },
  })
  if (!existingTrip) return NextResponse.json({ error: "Výlet nenalezen" }, { status: 404 })

  // Compute diff
  const existingStopMap = new Map(existingTrip.stops.map((s) => [s.id, s]))
  const toUpdate = stopsFromJson.filter((s: { id?: string }) => s.id && existingStopMap.has(s.id))
  const toCreate = stopsFromJson.filter((s: { id?: string }) => !s.id || !existingStopMap.has(s.id))
  const jsonStopIds = new Set(stopsFromJson.filter((s: { id?: string }) => s.id).map((s: { id: string }) => s.id))
  const toDelete = existingTrip.stops.filter((s) => !jsonStopIds.has(s.id))

  if (preview) {
    return NextResponse.json({
      toCreate: toCreate.length,
      toUpdate: toUpdate.length,
      toDelete: toDelete.length,
      deletedStopTitles: toDelete.map((s) => s.title),
    })
  }

  // Update trip metadata
  await prisma.trip.update({
    where: { id },
    data: {
      title,
      description: description || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      coverPhoto: coverPhoto || null,
      coverPhotoFocus: coverPhotoFocus ? JSON.stringify(coverPhotoFocus) : null,
      participants: JSON.stringify(Array.isArray(participants) ? participants : []),
      country: country || null,
      tripType: tripType || null,
      tips: tips ? JSON.stringify(tips) : null,
    },
  })

  // Update existing stops (metadata only — photos are managed in the stop editor)
  for (const stop of toUpdate) {
    if (!stop.title || stop.lat == null || stop.lng == null) continue
    await prisma.stop.update({
      where: { id: stop.id },
      data: {
        title: stop.title,
        description: stop.description || null,
        date: stop.date ? new Date(stop.date) : null,
        lat: Number(stop.lat),
        lng: Number(stop.lng),
        order: stop.order ?? 0,
        tags: stop.tags ? JSON.stringify(stop.tags) : null,
      },
    })
  }

  // Create new stops (with photos from JSON)
  for (const stop of toCreate) {
    if (!stop.title || stop.lat == null || stop.lng == null) continue
    const createdStop = await prisma.stop.create({
      data: {
        tripId: id,
        title: stop.title,
        description: stop.description || null,
        date: stop.date ? new Date(stop.date) : null,
        lat: Number(stop.lat),
        lng: Number(stop.lng),
        order: stop.order ?? 0,
        tags: stop.tags ? JSON.stringify(stop.tags) : null,
      },
    })
    if (Array.isArray(stop.photos)) {
      for (const photo of stop.photos) {
        if (!photo.url) continue
        await prisma.photo.create({
          data: {
            stopId: createdStop.id,
            url: photo.url,
            caption: photo.caption || null,
            order: photo.order ?? 0,
          },
        })
      }
    }
  }

  // Delete removed stops (cascade deletes photos)
  for (const stop of toDelete) {
    await prisma.stop.delete({ where: { id: stop.id } })
  }

  const trip = await prisma.trip.findUnique({ where: { id } })
  return NextResponse.json(trip)
}
