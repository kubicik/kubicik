import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import CardSeriesForm from "@/components/admin/CardSeriesForm"
import CardSeriesImport from "@/components/admin/CardSeriesImport"
import CardVariantManager from "@/components/admin/CardVariantManager"
import { sortCards } from "@/lib/sortCards"
import type { CardSeries, Card } from "@/types"

export default async function AdminCardSeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let series
  try {
    series = await prisma.cardSeries.findUnique({
      where: { id },
      include: {
        cards: {
          include: { variants: { orderBy: { variantName: "asc" } } },
        },
      },
    })
  } catch (err) {
    throw new Error(`Nepodařilo se načíst sérii: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (!series) notFound()

  const seriesData: CardSeries = {
    id: series.id,
    name: series.name,
    year: series.year,
    tier: series.tier as "premium" | "regular",
    displayMode: series.displayMode as "missing_only" | "full_collection",
    totalCardsCount: series.totalCardsCount,
    imageUrl: series.imageUrl,
    slug: series.slug,
    createdAt: series.createdAt.toISOString(),
    updatedAt: series.updatedAt.toISOString(),
  }

  const cards: Card[] = sortCards(series.cards).map((c) => ({
    id: c.id,
    seriesId: c.seriesId,
    number: c.number,
    name: c.name,
    order: c.order,
    createdAt: c.createdAt.toISOString(),
    variants: c.variants.map((v) => ({
      id: v.id,
      cardId: v.cardId,
      variantName: v.variantName,
      limitNumber: v.limitNumber,
      isOwned: v.isOwned,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    })),
  }))

  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        <Link href="/admin/kartickar" className="text-[#8e8e93] hover:text-[#1d1d1f] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">{series.name}</h1>
          <p className="text-[#8e8e93] text-sm mt-0.5">{series.year} · {series.cards.length} karet</p>
        </div>
        <Link
          href={`/kartickar/${series.slug}`}
          target="_blank"
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#007aff] bg-[#f0f6ff] hover:bg-[#e0eeff] rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Zobrazit veřejně
        </Link>
      </div>

      <div className="space-y-6">
        <CardSeriesForm initial={seriesData} />
        <CardSeriesImport seriesId={series.id} />
        <CardVariantManager seriesId={series.id} initialCards={cards} totalCardsCount={series.totalCardsCount} />
      </div>
    </div>
  )
}
