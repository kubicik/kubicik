import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import CardChecklist from "@/components/public/CardChecklist"
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
      cards: {
        orderBy: [{ order: "asc" }, { number: "asc" }],
        include: { variants: { orderBy: { variantName: "asc" } } },
      },
    },
  })
  if (!series) notFound()

  const allVariants = series.cards.flatMap((c) => c.variants)
  const ownedCount = allVariants.filter((v) => v.isOwned).length
  const pct = series.totalCardsCount > 0 ? Math.min(100, Math.round((ownedCount / series.totalCardsCount) * 100)) : 0

  const cards: Card[] = series.cards.map((c) => ({
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
            <h1 className="text-2xl font-bold text-[#1d1d1f] mb-3">{series.name}</h1>
            <p className="text-sm text-[#8e8e93] mb-2">
              {ownedCount} / {series.totalCardsCount > 0 ? series.totalCardsCount : allVariants.length} variant · {pct}% nasbíráno
            </p>
            <div className="h-2.5 bg-[#e5e5ea] rounded-full overflow-hidden max-w-xs">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: pct === 100 ? "#34c759" : pct > 50 ? "#007aff" : "#ff9f0a",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <CardChecklist
        cards={cards}
        displayMode={series.displayMode as "missing_only" | "full_collection"}
      />
    </div>
  )
}
