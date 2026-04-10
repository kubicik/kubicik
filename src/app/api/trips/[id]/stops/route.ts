import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const stops = await prisma.stop.findMany({
    where: { tripId: id },
    orderBy: { order: "asc" },
    include: { photos: { orderBy: { order: "asc" } } },
  })
  return NextResponse.json(stops)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { title, description, date, lat, lng, order } = body

  if (!title || lat === undefined || lng === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const stop = await prisma.stop.create({
    data: {
      tripId: id,
      title,
      description: description || null,
      date: date ? new Date(date) : null,
      lat,
      lng,
      order: order ?? 0,
    },
    include: { photos: true },
  })
  return NextResponse.json(stop, { status: 201 })
}
