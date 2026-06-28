import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { seriesId, name, isSpecial, order } = await req.json()
  if (!seriesId || !name) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

  const subset = await prisma.cardSubset.create({
    data: {
      seriesId,
      name,
      isSpecial: !!isSpecial,
      order: Number(order) || 0,
    },
    include: { parallels: true, cards: { include: { variants: true } } },
  })

  return NextResponse.json({
    ...subset,
    createdAt: subset.createdAt.toISOString(),
  }, { status: 201 })
}
