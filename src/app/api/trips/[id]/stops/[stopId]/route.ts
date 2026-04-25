import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stopId: string }> }
) {
  const { stopId } = await params
  const body = await request.json()
  const { title, description, date, lat, lng, order, tags } = body

  const stop = await prisma.stop.update({
    where: { id: stopId },
    data: {
      title,
      description: description || null,
      date: date ? new Date(date) : null,
      lat,
      lng,
      order: order ?? 0,
      tags: tags || null,
    },
    include: { photos: { orderBy: { order: "asc" } } },
  })
  return NextResponse.json(stop)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; stopId: string }> }
) {
  const { stopId } = await params
  await prisma.stop.delete({ where: { id: stopId } })
  return NextResponse.json({ ok: true })
}

// Add photo to a stop
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stopId: string }> }
) {
  const { stopId } = await params
  const body = await request.json()
  const { url, caption, order } = body

  const photo = await prisma.photo.create({
    data: {
      stopId,
      url,
      caption: caption || null,
      order: order ?? 0,
    },
  })
  return NextResponse.json(photo, { status: 201 })
}
