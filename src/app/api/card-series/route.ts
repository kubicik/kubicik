import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slugify"
import { auth } from "@/auth"

export async function GET() {
  const series = await prisma.cardSeries.findMany({
    orderBy: [{ year: "desc" }, { name: "asc" }],
    include: {
      cards: { select: { variants: { select: { isOwned: true, price: true } } } },
      tags: true,
    },
  })
  return NextResponse.json(series.map(serialize))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, year, sport, tier, displayMode, totalCardsCount, imageUrl, isPricingEnabled, tagIds } = body
  if (!name || !year) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

  let slug = slugify(name + " " + year)
  const existing = await prisma.cardSeries.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

  const series = await prisma.cardSeries.create({
    data: {
      name,
      year: Number(year),
      sport: sport ?? "football",
      tier: tier ?? "regular",
      displayMode: displayMode ?? "missing_only",
      totalCardsCount: Number(totalCardsCount) || 0,
      imageUrl: imageUrl || null,
      isPricingEnabled: !!isPricingEnabled,
      slug,
      tags: tagIds?.length ? { connect: (tagIds as string[]).map((id) => ({ id })) } : undefined,
    },
    include: { cards: { select: { variants: { select: { isOwned: true, price: true } } } }, tags: true },
  })
  return NextResponse.json(serialize(series), { status: 201 })
}

function serialize(s: {
  id: string; name: string; year: number; sport: string; tier: string; displayMode: string
  totalCardsCount: number; imageUrl: string | null; isPricingEnabled: boolean
  slug: string; createdAt: Date; updatedAt: Date
  cards: { variants: { isOwned: boolean; price: number | null }[] }[]
  tags: { id: string; name: string; color: string; symbol: string; createdAt: Date; updatedAt: Date }[]
}) {
  const allVariants = s.cards.flatMap((c) => c.variants)
  const ownedVariantsCount = allVariants.filter((v) => v.isOwned).length
  const totalVariantsCount = allVariants.length
  const collectionValue = s.isPricingEnabled
    ? allVariants.filter((v) => v.isOwned).reduce((sum, v) => sum + (v.price ?? 0), 0)
    : null

  return {
    id: s.id, name: s.name, year: s.year, sport: s.sport, tier: s.tier, displayMode: s.displayMode,
    totalCardsCount: s.totalCardsCount, imageUrl: s.imageUrl, slug: s.slug,
    isPricingEnabled: s.isPricingEnabled,
    createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString(),
    ownedVariantsCount, totalVariantsCount, collectionValue,
    tags: s.tags.map((t) => ({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() })),
  }
}
