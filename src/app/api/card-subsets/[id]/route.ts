import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { name, isSpecial, order } = await req.json()

  const subset = await prisma.cardSubset.update({
    where: { id },
    data: {
      name: name ?? undefined,
      isSpecial: isSpecial !== undefined ? !!isSpecial : undefined,
      order: order != null ? Number(order) : undefined,
    },
  })
  return NextResponse.json({ ...subset, createdAt: subset.createdAt.toISOString() })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.cardSubset.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
