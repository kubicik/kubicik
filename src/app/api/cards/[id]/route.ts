import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { imageUrl } = await req.json()

  const card = await prisma.card.update({
    where: { id },
    data: { imageUrl: imageUrl || null },
  })
  return NextResponse.json({ ...card, createdAt: card.createdAt.toISOString() })
}
