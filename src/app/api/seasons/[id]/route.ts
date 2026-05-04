import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/auth"

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Chybí název" }, { status: 400 })
  const season = await prisma.season.update({ where: { id }, data: { name: name.trim() } })
  return NextResponse.json({ ...season, createdAt: season.createdAt.toISOString(), updatedAt: season.updatedAt.toISOString() })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.season.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
