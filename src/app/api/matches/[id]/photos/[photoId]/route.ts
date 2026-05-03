import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/auth"

type Ctx = { params: Promise<{ id: string; photoId: string }> }

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { photoId } = await params
  await prisma.matchPhoto.delete({ where: { id: photoId } })
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { photoId } = await params
  const { caption } = await req.json()
  const photo = await prisma.matchPhoto.update({ where: { id: photoId }, data: { caption } })
  return NextResponse.json({ ...photo, createdAt: photo.createdAt.toISOString() })
}
