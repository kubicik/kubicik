import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface VariantInput {
  variant_name: string
  limit_number: number | null
}

interface CardInput {
  number: string
  name: string
  variants: VariantInput[]
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: seriesId } = await params

  const series = await prisma.cardSeries.findUnique({ where: { id: seriesId } })
  if (!series) return NextResponse.json({ error: "Series not found" }, { status: 404 })

  let cards: CardInput[]
  try {
    const body = await req.json()
    cards = Array.isArray(body) ? body : body.cards
    if (!Array.isArray(cards)) throw new Error("Expected array")
  } catch {
    return NextResponse.json({ error: "Invalid JSON — expected array of cards" }, { status: 400 })
  }

  const validCards = cards.filter((c) => c.number && c.name)
  const total = validCards.length
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function emit(data: object) {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"))
      }

      let created = 0
      let updated = 0
      let variantsAdded = 0

      try {
        for (let i = 0; i < validCards.length; i++) {
          const cardInput = validCards[i]

          const existingCard = await prisma.card.findUnique({
            where: { seriesId_number: { seriesId, number: String(cardInput.number) } },
          })

          let cardId: string
          if (existingCard) {
            cardId = existingCard.id
            await prisma.card.update({ where: { id: cardId }, data: { name: String(cardInput.name) } })
            updated++
          } else {
            const newCard = await prisma.card.create({
              data: { seriesId, number: String(cardInput.number), name: String(cardInput.name) },
            })
            cardId = newCard.id
            created++
          }

          for (const v of cardInput.variants ?? []) {
            if (!v.variant_name) continue
            const existingVariant = await prisma.cardVariant.findUnique({
              where: { cardId_variantName: { cardId, variantName: String(v.variant_name) } },
            })
            if (!existingVariant) {
              await prisma.cardVariant.create({
                data: {
                  cardId,
                  variantName: String(v.variant_name),
                  limitNumber: v.limit_number != null ? Number(v.limit_number) : null,
                  isOwned: false,
                },
              })
              variantsAdded++
            }
          }

          emit({ done: i + 1, total })
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
