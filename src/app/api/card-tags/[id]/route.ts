import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { name, color, symbol } = await req.json()

  const tag = await prisma.cardTag.update({
    where: { id },
    data: {
      name: name?.trim() ?? undefined,
      color: color ?? undefined,
      symbol: symbol?.trim() ?? undefined,
    },
  })
  return NextResponse.json({ ...tag, createdAt: tag.createdAt.toISOString(), updatedAt: tag.updatedAt.toISOString() })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.cardTag.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
