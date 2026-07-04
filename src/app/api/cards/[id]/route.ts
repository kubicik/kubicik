import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const data: { imageUrl?: string | null; club?: string | null; name?: string; number?: string } = {}
  if ("imageUrl" in body) data.imageUrl = body.imageUrl || null
  if ("club" in body) data.club = typeof body.club === "string" && body.club.trim() ? body.club.trim() : null
  if ("name" in body && typeof body.name === "string" && body.name.trim()) data.name = body.name.trim()
  if ("number" in body && typeof body.number === "string" && body.number.trim()) data.number = body.number.trim()

  try {
    const card = await prisma.card.update({ where: { id }, data })
    return NextResponse.json({ ...card, createdAt: card.createdAt.toISOString(), updatedAt: card.updatedAt.toISOString() })
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Karta s tímto číslem v subsetu již existuje" }, { status: 409 })
    }
    throw err
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.card.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
