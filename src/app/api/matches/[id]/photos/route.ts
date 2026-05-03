import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/auth"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const count = await prisma.matchPhoto.count({ where: { matchId: id } })
  const photo = await prisma.matchPhoto.create({
    data: {
      matchId: id,
      url: body.url,
      caption: body.caption ?? null,
      order: count,
    },
  })
  return NextResponse.json({ ...photo, createdAt: photo.createdAt.toISOString() }, { status: 201 })
}
