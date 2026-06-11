import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { sortCards } from "@/lib/sortCards"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const series = await prisma.cardSeries.findUnique({
    where: { id },
    include: {
      cards: {
        include: {
          variants: { orderBy: { variantName: "asc" } },
        },
      },
    },
  })
  if (!series) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    ...series,
    createdAt: series.createdAt.toISOString(),
    updatedAt: series.updatedAt.toISOString(),
    cards: sortCards(series.cards).map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      variants: c.variants.map((v) => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      })),
    })),
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, year, tier, displayMode, totalCardsCount, imageUrl } = body

  const series = await prisma.cardSeries.update({
    where: { id },
    data: {
      name: name ?? undefined,
      year: year != null ? Number(year) : undefined,
      tier: tier ?? undefined,
      displayMode: displayMode ?? undefined,
      totalCardsCount: totalCardsCount != null ? Number(totalCardsCount) : undefined,
      imageUrl: imageUrl !== undefined ? (imageUrl || null) : undefined,
    },
  })
  return NextResponse.json({ ...series, createdAt: series.createdAt.toISOString(), updatedAt: series.updatedAt.toISOString() })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.cardSeries.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
