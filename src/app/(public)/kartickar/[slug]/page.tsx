import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import CardChecklist from "@/components/public/CardChecklist"
import { sortCards } from "@/lib/sortCards"
import { relativeTime, seriesLastChanged } from "@/lib/relativeTime"
import type { Card } from "@/types"

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const series = await prisma.cardSeries.findMany({ select: { slug: true } })
    return series.map((s) => ({ slug: s.slug }))
  } catch {
    return []
  }
}

export default async function CardSeriesDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const series = await prisma.cardSeries.findUnique({
    where: { slug },
    include: {
      cards: { include: { variants: { orderBy: { variantName: "asc" } } } },
      tags: true,
    },
  })
  if (!series) notFound()

  const allVariants = series.cards.flatMap((c) => c.variants)
  const ownedCount = allVariants.filter((v) => v.isOwned).length
  const pct = series.totalCardsCount > 0 ? Math.min(100, Math.round((ownedCount / series.totalCardsCount) * 100)) : 0
  const lastChanged = seriesLastChanged(series.updatedAt, allVariants.map((v) => v.updatedAt))

  const collectionValue = series.isPricingEnabled
    ? Math.round(series.cards.reduce((sum, c) => sum + (c.price ?? 0) * c.variants.filter((v) => v.isOwned).length, 0))
    : null
  const maxValue = series.isPricingEnabled
    ? Math.round(series.cards.reduce((sum, c) => sum + (c.price ?? 0) * c.variants.length, 0))
    : null

  const cards: Card[] = sortCards(series.cards).map((c) => ({
    id: c.id,
    seriesId: c.seriesId,
    number: c.number,
    name: c.name,
    order: c.order,
    imageUrl: c.imageUrl,
    price: c.price,
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

  const hasCardImages = cards.some((c) => c.imageUrl)

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/kartickar" className="text-sm text-[#007aff] hover:underline flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Všechny série
        </Link>

        <div className="flex items-start gap-5">
          {series.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={series.imageUrl}
              alt={series.name}
              className="w-20 h-28 object-cover rounded-xl border border-[#e5e5ea] flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#8e8e93] mb-1">{series.year}</p>
            <h1 className="text-2xl font-bold text-[#1d1d1f] mb-2">{series.name}</h1>

            {series.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {series.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.symbol} {tag.name}
                  </span>
                ))}
              </div>
            )}

            <p className="text-sm text-[#8e8e93] mb-1">
              {ownedCount} / {series.totalCardsCount > 0 ? series.totalCardsCount : allVariants.length} variant · {pct}% nasbíráno
            </p>
            <p className="text-xs text-[#c7c7cc] mb-2">
              Aktualizováno {relativeTime(lastChanged)}
            </p>

            <div className="h-2.5 bg-[#e5e5ea] rounded-full overflow-hidden max-w-xs mb-3">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: pct === 100 ? "#34c759" : pct > 50 ? "#007aff" : "#ff9f0a",
                }}
              />
            </div>

            {collectionValue != null && (
              <div className="flex items-center gap-2 p-3 bg-[#f9f9fb] rounded-xl border border-[#e5e5ea] max-w-xs">
                <svg className="w-4 h-4 text-[#34c759] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs text-[#8e8e93]">Hodnota sbírky</p>
                  <p className="text-sm font-semibold text-[#1d1d1f]">
                    {collectionValue.toLocaleString("cs-CZ")} Kč
                    {maxValue != null && maxValue > 0 && (
                      <span className="text-xs font-normal text-[#8e8e93] ml-1">
                        / {maxValue.toLocaleString("cs-CZ")} Kč max
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CardChecklist
        cards={cards}
        displayMode={series.displayMode as "missing_only" | "full_collection"}
        showImages={series.tier === "premium" && hasCardImages}
      />
    </div>
  )
}
