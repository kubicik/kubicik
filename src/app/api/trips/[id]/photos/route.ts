import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/auth"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const photos = await prisma.tripPhoto.findMany({
    where: { tripId: id },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(
    photos.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))
  )
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const count = await prisma.tripPhoto.count({ where: { tripId: id } })
  const photo = await prisma.tripPhoto.create({
    data: {
      tripId: id,
      stopId: body.stopId ?? null,
      isDrone: body.isDrone ?? false,
      url: body.url,
      caption: body.caption ?? null,
      order: count,
    },
  })
  return NextResponse.json({ ...photo, createdAt: photo.createdAt.toISOString() }, { status: 201 })
}
