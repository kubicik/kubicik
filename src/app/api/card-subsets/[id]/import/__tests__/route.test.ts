import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { mockCardSubset, mockCardParallel, mockCard, mockCardVariant, mockAuth } = vi.hoisted(() => ({
  mockCardSubset: { findUnique: vi.fn() },
  mockCardParallel: { findFirst: vi.fn(), create: vi.fn() },
  mockCard: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  mockCardVariant: { findUnique: vi.fn(), create: vi.fn() },
  mockAuth: vi.fn(),
}))

vi.mock("@/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    cardSubset: mockCardSubset,
    cardParallel: mockCardParallel,
    card: mockCard,
    cardVariant: mockCardVariant,
  },
}))

import { POST } from "../route"

const SESSION = { user: { id: "u1", name: "Admin" } }

function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

function req(subsetId: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/card-subsets/${subsetId}/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

async function readStream(res: Response): Promise<Record<string, unknown>[]> {
  const text = await new Response(res.body).text()
  return text.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as Record<string, unknown>)
}

beforeEach(() => {
  mockAuth.mockReset()
  mockCardSubset.findUnique.mockReset()
  mockCardParallel.findFirst.mockReset()
  mockCardParallel.create.mockReset()
  mockCard.findUnique.mockReset()
  mockCard.create.mockReset()
  mockCard.update.mockReset()
  mockCardVariant.findUnique.mockReset()
  mockCardVariant.create.mockReset()
})

describe("POST /api/card-subsets/[id]/import", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(req("sub1", { cards: [] }), params("sub1"))
    expect(res.status).toBe(401)
  })

  it("returns 404 when subset not found", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.findUnique.mockResolvedValue(null)
    const res = await POST(req("sub1", { cards: [] }), params("sub1"))
    expect(res.status).toBe(404)
  })

  it("returns 400 when cards is not an array", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.findUnique.mockResolvedValue({ id: "sub1" })
    const res = await POST(req("sub1", { cards: "not an array" }), params("sub1"))
    expect(res.status).toBe(400)
  })

  it("creates cards with club field and streams progress", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.findUnique.mockResolvedValue({ id: "sub1" })
    mockCardParallel.findFirst.mockResolvedValue(null)
    mockCardParallel.create.mockResolvedValue({ id: "par1" })
    mockCard.findUnique.mockResolvedValue(null)
    mockCard.create.mockResolvedValue({ id: "c1" })
    mockCardVariant.findUnique.mockResolvedValue(null)
    mockCardVariant.create.mockResolvedValue({ id: "v1" })

    const res = await POST(req("sub1", {
      parallels: [{ name: "Base", limit_number: null }],
      cards: [{ number: "1", name: "Haaland", club: "Manchester City" }],
    }), params("sub1"))

    const lines = await readStream(res as unknown as Response)
    const progress = lines.filter((l: Record<string, unknown>) => l.total)
    const result = lines.find((l: Record<string, unknown>) => l.ok) as Record<string, unknown>

    expect(progress).toHaveLength(1)
    expect(result.created).toBe(1)
    expect(result.updated).toBe(0)
    expect(result.variantsAdded).toBe(1)

    expect(mockCard.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ number: "1", name: "Haaland", club: "Manchester City" }),
      })
    )
  })

  it("creates card with null club when club is absent", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.findUnique.mockResolvedValue({ id: "sub1" })
    mockCardParallel.findFirst.mockResolvedValue({ id: "par1" })
    mockCard.findUnique.mockResolvedValue(null)
    mockCard.create.mockResolvedValue({ id: "c1" })
    mockCardVariant.findUnique.mockResolvedValue(null)
    mockCardVariant.create.mockResolvedValue({ id: "v1" })

    await readStream(
      (await POST(req("sub1", {
        parallels: [{ name: "Base", limit_number: null }],
        cards: [{ number: "1", name: "Foden" }],
      }), params("sub1"))) as unknown as Response
    )

    expect(mockCard.create.mock.calls[0][0].data.club).toBeNull()
  })

  it("updates existing card name and club", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.findUnique.mockResolvedValue({ id: "sub1" })
    mockCardParallel.findFirst.mockResolvedValue({ id: "par1" })
    mockCard.findUnique.mockResolvedValue({ id: "c1" })
    mockCard.update.mockResolvedValue({ id: "c1" })
    mockCardVariant.findUnique.mockResolvedValue({ id: "v1" })

    const lines = await readStream(
      (await POST(req("sub1", {
        cards: [{ number: "1", name: "Haaland Updated", club: "Man City" }],
      }), params("sub1"))) as unknown as Response
    )

    const result = lines.find((l: Record<string, unknown>) => l.ok) as Record<string, unknown>
    expect(result.created).toBe(0)
    expect(result.updated).toBe(1)

    expect(mockCard.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Haaland Updated", club: "Man City" }),
      })
    )
  })

  it("finds existing parallel instead of creating", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.findUnique.mockResolvedValue({ id: "sub1" })
    mockCardParallel.findFirst.mockResolvedValue({ id: "par1" })
    mockCard.findUnique.mockResolvedValue(null)
    mockCard.create.mockResolvedValue({ id: "c1" })
    mockCardVariant.findUnique.mockResolvedValue(null)
    mockCardVariant.create.mockResolvedValue({ id: "v1" })

    await POST(req("sub1", {
      parallels: [{ name: "Base", limit_number: null }],
      cards: [{ number: "1", name: "Haaland", club: null }],
    }), params("sub1"))

    expect(mockCardParallel.create).not.toHaveBeenCalled()
  })

  it("does not create variant if it already exists", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.findUnique.mockResolvedValue({ id: "sub1" })
    mockCardParallel.findFirst.mockResolvedValue({ id: "par1" })
    mockCard.findUnique.mockResolvedValue({ id: "c1" })
    mockCard.update.mockResolvedValue({ id: "c1" })
    mockCardVariant.findUnique.mockResolvedValue({ id: "v1" })

    const lines = await readStream(
      (await POST(req("sub1", {
        parallels: [{ name: "Base", limit_number: null }],
        cards: [{ number: "1", name: "Haaland", club: null }],
      }), params("sub1"))) as unknown as Response
    )

    const result = lines.find((l: Record<string, unknown>) => l.ok) as Record<string, unknown>
    expect(result.variantsAdded).toBe(0)
    expect(mockCardVariant.create).not.toHaveBeenCalled()
  })

  it("streams empty result when cards array is empty", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.findUnique.mockResolvedValue({ id: "sub1" })

    const lines = await readStream(
      (await POST(req("sub1", { cards: [] }), params("sub1"))) as unknown as Response
    )

    const result = lines.find((l: Record<string, unknown>) => l.ok) as Record<string, unknown>
    expect(result.created).toBe(0)
    expect(result.updated).toBe(0)
    expect(result.variantsAdded).toBe(0)
  })
})
