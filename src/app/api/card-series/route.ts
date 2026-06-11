import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slugify"
import { auth } from "@/auth"

export async function GET() {
  const series = await prisma.cardSeries.findMany({
    orderBy: [{ year: "desc" }, { name: "asc" }],
    include: {
      cards: {
        include: { variants: { select: { isOwned: true } } },
      },
    },
  })
  return NextResponse.json(series.map(serialize))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, year, tier, displayMode, totalCardsCount, imageUrl } = body
  if (!name || !year) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

  let slug = slugify(name + " " + year)
  const existing = await prisma.cardSeries.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

  const series = await prisma.cardSeries.create({
    data: {
      name,
      year: Number(year),
      tier: tier ?? "regular",
      displayMode: displayMode ?? "missing_only",
      totalCardsCount: Number(totalCardsCount) || 0,
      imageUrl: imageUrl || null,
      slug,
    },
    include: { cards: { include: { variants: { select: { isOwned: true } } } } },
  })
  return NextResponse.json(serialize(series), { status: 201 })
}

function serialize(s: Parameters<typeof serializeRaw>[0]) {
  return serializeRaw(s)
}

function serializeRaw(s: {
  id: string; name: string; year: number; tier: string; displayMode: string
  totalCardsCount: number; imageUrl: string | null; slug: string
  createdAt: Date; updatedAt: Date
  cards: { variants: { isOwned: boolean }[] }[]
}) {
  return {
    id: s.id,
    name: s.name,
    year: s.year,
    tier: s.tier,
    displayMode: s.displayMode,
    totalCardsCount: s.totalCardsCount,
    imageUrl: s.imageUrl,
    slug: s.slug,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    ownedVariantsCount: s.cards.flatMap((c) => c.variants).filter((v) => v.isOwned).length,
    totalVariantsCount: s.cards.flatMap((c) => c.variants).length,
  }
}
