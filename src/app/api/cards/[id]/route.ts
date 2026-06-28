import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const data: { imageUrl?: string | null; club?: string | null } = {}
  if ("imageUrl" in body) data.imageUrl = body.imageUrl || null
  if ("club" in body) data.club = typeof body.club === "string" && body.club.trim() ? body.club.trim() : null

  const card = await prisma.card.update({ where: { id }, data })
  return NextResponse.json({ ...card, createdAt: card.createdAt.toISOString(), updatedAt: card.updatedAt.toISOString() })
}
