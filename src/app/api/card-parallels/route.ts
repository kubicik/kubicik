import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { subsetId, name, limitNumber, isCollected, order } = await req.json()
  if (!subsetId || !name) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

  // Create the parallel
  const parallel = await prisma.cardParallel.create({
    data: {
      subsetId,
      name,
      limitNumber: limitNumber != null ? Number(limitNumber) : null,
      isCollected: isCollected !== false,
      order: Number(order) || 0,
    },
  })

  // Create CardVariant records (isOwned=false) for all existing cards in this subset
  const cards = await prisma.card.findMany({ where: { subsetId }, select: { id: true } })
  if (cards.length > 0) {
    await prisma.cardVariant.createMany({
      data: cards.map((c) => ({ cardId: c.id, parallelId: parallel.id })),
    })
  }

  return NextResponse.json(parallel, { status: 201 })
}
