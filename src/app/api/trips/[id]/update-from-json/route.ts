import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const {
    title, description, startDate, endDate,
    country, tripType, participants, tips,
    coverPhoto, coverPhotoFocus, stops = [],
  } = body

  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: "Chybí povinná pole: title, startDate, endDate" }, { status: 400 })
  }

  const existing = await prisma.trip.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Výlet nenalezen" }, { status: 404 })

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

  await prisma.stop.deleteMany({ where: { tripId: id } })

  for (const stop of stops) {
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

  const trip = await prisma.trip.findUnique({ where: { id } })
  return NextResponse.json(trip)
}
