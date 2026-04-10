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
  return NextResponse.json(trip)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { title, description, startDate, endDate, coverPhoto, participants, published } = body

  const trip = await prisma.trip.update({
    where: { id },
    data: {
      title,
      description: description || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      coverPhoto: coverPhoto || null,
      participants: JSON.stringify(participants || []),
      published: published ?? false,
    },
  })
  return NextResponse.json(trip)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.trip.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
