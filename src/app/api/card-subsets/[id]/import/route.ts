import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface ParallelInput { name: string; limit_number: number | null }
interface SubsetImportInput {
  parallels?: ParallelInput[]
  cards: { number: string; name: string; club?: string | null }[]
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: subsetId } = await params

  const subset = await prisma.cardSubset.findUnique({ where: { id: subsetId } })
  if (!subset) return NextResponse.json({ error: "Subset not found" }, { status: 404 })

  let input: SubsetImportInput
  try {
    const body = await req.json()
    if (!Array.isArray(body.cards)) throw new Error("Expected cards array")
    input = body as SubsetImportInput
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const totalCards = input.cards?.length ?? 0
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
        // Sync parallels: find or create
        const parallelMap = new Map<string, string>()
        for (const pInput of input.parallels ?? []) {
          if (!pInput.name) continue
          let parallel = await prisma.cardParallel.findFirst({ where: { subsetId, name: pInput.name } })
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
        for (const cardInput of input.cards ?? []) {
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

          // Ensure CardVariant rows exist for all parallels
          for (const [, parallelId] of parallelMap) {
            const existingVariant = await prisma.cardVariant.findUnique({
              where: { cardId_parallelId: { cardId, parallelId } },
            })
            if (!existingVariant) {
              await prisma.cardVariant.create({ data: { cardId, parallelId, isOwned: false } })
              variantsAdded++
            }
          }

          done++
          emit({ done, total: totalCards })
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
