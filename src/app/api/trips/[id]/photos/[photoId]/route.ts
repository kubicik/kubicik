import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/auth"

type Ctx = { params: Promise<{ id: string; photoId: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { photoId } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if ("stopId" in body) data.stopId = body.stopId ?? null
  if ("isDrone" in body) data.isDrone = body.isDrone
  if ("caption" in body) data.caption = body.caption ?? null
  if ("order" in body) data.order = body.order

  const photo = await prisma.tripPhoto.update({ where: { id: photoId }, data })
  return NextResponse.json({ ...photo, createdAt: photo.createdAt.toISOString() })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { photoId } = await params
  await prisma.tripPhoto.delete({ where: { id: photoId } })
  return new NextResponse(null, { status: 204 })
}
