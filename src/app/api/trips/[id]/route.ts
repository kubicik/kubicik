import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { normalizeNames, syncTripParticipants } from "@/lib/persons"

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
  return NextResponse.json(trip)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { title, description, startDate, endDate, coverPhoto, coverPhotoFocus, participants, published, status, country, tripType, tips, expandAllDays } = body

  const cleanParticipants = normalizeNames(participants)

  const trip = await prisma.trip.update({
    where: { id },
    data: {
      title,
      description: description || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      coverPhoto: coverPhoto || null,
      coverPhotoFocus: coverPhotoFocus || null,
      participants: JSON.stringify(cleanParticipants),
      published: published ?? false,
      status: status === "closed" ? "closed" : "open",
      country: country || null,
      tripType: tripType || null,
      tips: tips || null,
      expandAllDays: expandAllDays ?? false,
    },
  })

  await syncTripParticipants(trip.id, cleanParticipants)

  return NextResponse.json(trip)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.trip.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
