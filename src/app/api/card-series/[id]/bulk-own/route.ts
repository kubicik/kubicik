import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: seriesId } = await params
  const { subsetId, missingNumbers, mode = "missing" }: {
    subsetId?: string
    missingNumbers: string[]
    mode?: "missing" | "own"
  } = await req.json()

  const numberSet = new Set(missingNumbers.map((n) => String(n).trim()))

  const cards = await prisma.card.findMany({
    where: subsetId ? { subsetId } : { subset: { seriesId } },
    include: { variants: { select: { id: true } } },
  })

  if (mode === "own") {
    // Mark only the specified numbers as owned; leave everything else untouched
    const ownedVariantIds: string[] = []
    for (const card of cards) {
      if (numberSet.has(card.number)) {
        for (const v of card.variants) ownedVariantIds.push(v.id)
      }
    }
    await prisma.cardVariant.updateMany({ where: { id: { in: ownedVariantIds } }, data: { isOwned: true } })
    return NextResponse.json({ ok: true, owned: ownedVariantIds.length, missing: 0 })
  }

  // mode === "missing": provided numbers are missing, everything else is owned
  const ownedVariantIds: string[] = []
  const missingVariantIds: string[] = []

  for (const card of cards) {
    const isMissing = numberSet.has(card.number)
    for (const v of card.variants) {
      if (isMissing) missingVariantIds.push(v.id)
      else ownedVariantIds.push(v.id)
    }
  }

  await prisma.$transaction([
    prisma.cardVariant.updateMany({ where: { id: { in: ownedVariantIds } }, data: { isOwned: true } }),
    prisma.cardVariant.updateMany({ where: { id: { in: missingVariantIds } }, data: { isOwned: false } }),
  ])

  return NextResponse.json({ ok: true, owned: ownedVariantIds.length, missing: missingVariantIds.length })
}
