import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// New format: array of subsets
interface ParallelInput { name: string; limit_number: number | null }
interface SubsetInput {
  subset: string
  is_special?: boolean
  parallels: ParallelInput[]
  cards: { number: string; name: string; club?: string | null }[]
}

// Old format (backward compat): flat card array
interface LegacyCardInput {
  number: string
  name: string
  variants: { variant_name: string; limit_number: number | null }[]
}

function isNewFormat(body: unknown[]): body is SubsetInput[] {
  return body.length > 0 && typeof (body[0] as Record<string, unknown>).subset === "string"
}

function legacyToNew(cards: LegacyCardInput[]): SubsetInput[] {
  // Collect all unique variant names across all cards to form parallels
  const parallelSet = new Map<string, number | null>()
  for (const c of cards) {
    for (const v of c.variants ?? []) {
      if (v.variant_name && !parallelSet.has(v.variant_name)) {
        parallelSet.set(v.variant_name, v.limit_number ?? null)
      }
    }
  }
  const parallels: ParallelInput[] = Array.from(parallelSet.entries()).map(([name, limit_number]) => ({
    name,
    limit_number,
  }))
  return [{
    subset: "Base",
    is_special: false,
    parallels,
    cards: cards.map((c) => ({ number: String(c.number), name: String(c.name), club: null })),
  }]
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: seriesId } = await params

  const series = await prisma.cardSeries.findUnique({ where: { id: seriesId } })
  if (!series) return NextResponse.json({ error: "Series not found" }, { status: 404 })

  let subsets: SubsetInput[]
  try {
    const body = await req.json()
    const arr = Array.isArray(body) ? body : body.subsets ?? body.cards
    if (!Array.isArray(arr)) throw new Error("Expected array")
    subsets = isNewFormat(arr) ? (arr as SubsetInput[]) : legacyToNew(arr as LegacyCardInput[])
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const totalCards = subsets.reduce((sum, s) => sum + (s.cards?.length ?? 0), 0)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function emit(data: object) {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"))
      }

      let created = 0
      let updated = 0
      let variantsAdded = 0
      let done = 0

      try {
        for (const subsetInput of subsets) {
          if (!subsetInput.subset || !Array.isArray(subsetInput.cards)) continue

          // Find or create the subset by name within this series
          let subset = await prisma.cardSubset.findFirst({
            where: { seriesId, name: subsetInput.subset },
          })
          if (!subset) {
            subset = await prisma.cardSubset.create({
              data: {
                seriesId,
                name: subsetInput.subset,
                isSpecial: !!subsetInput.is_special,
                order: 0,
              },
            })
          }
          const subsetId = subset.id

          // Sync parallels: find or create each parallel, then create missing CardVariant rows
          const parallelMap = new Map<string, string>() // name → parallelId
          for (const pInput of subsetInput.parallels ?? []) {
            if (!pInput.name) continue
            let parallel = await prisma.cardParallel.findFirst({
              where: { subsetId, name: pInput.name },
            })
            if (!parallel) {
              parallel = await prisma.cardParallel.create({
                data: {
                  subsetId,
                  name: pInput.name,
                  limitNumber: pInput.limit_number != null ? Number(pInput.limit_number) : null,
                  isCollected: true,
                  order: parallelMap.size,
                },
              })
            }
            parallelMap.set(pInput.name, parallel.id)
          }

          // Import cards
          for (const cardInput of subsetInput.cards) {
            if (!cardInput.number || !cardInput.name) { done++; continue }

            const existingCard = await prisma.card.findUnique({
              where: { subsetId_number: { subsetId, number: String(cardInput.number) } },
            })

            let cardId: string
            if (existingCard) {
              cardId = existingCard.id
              await prisma.card.update({
                where: { id: cardId },
                data: {
                  name: String(cardInput.name),
                  club: cardInput.club !== undefined ? (cardInput.club ? String(cardInput.club) : null) : undefined,
                },
              })
              updated++
            } else {
              const newCard = await prisma.card.create({
                data: {
                  subsetId,
                  number: String(cardInput.number),
                  name: String(cardInput.name),
                  club: cardInput.club ? String(cardInput.club) : null,
                },
              })
              cardId = newCard.id
              created++
            }

            // Ensure CardVariant rows exist for all parallels in this subset
            for (const [, parallelId] of parallelMap) {
              const existingVariant = await prisma.cardVariant.findUnique({
                where: { cardId_parallelId: { cardId, parallelId } },
              })
              if (!existingVariant) {
                await prisma.cardVariant.create({
                  data: { cardId, parallelId, isOwned: false },
                })
                variantsAdded++
              }
            }

            done++
            emit({ done, total: totalCards })
          }
        }

        emit({ ok: true, created, updated, variantsAdded })
      } catch (err) {
        emit({ error: err instanceof Error ? err.message : "Import failed" })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  })
}
