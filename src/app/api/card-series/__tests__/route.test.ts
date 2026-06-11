import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ── mocks (vi.hoisted ensures vars exist before vi.mock factory runs) ──────────

const { mockCardSeries, mockAuth } = vi.hoisted(() => ({
  mockCardSeries: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  mockAuth: vi.fn(),
}))

vi.mock("@/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/slugify", () => ({
  slugify: (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
}))
vi.mock("@/lib/prisma", () => ({ prisma: { cardSeries: mockCardSeries } }))

import { GET, POST } from "../route"

// ── helpers ───────────────────────────────────────────────────────────────────

const SESSION = { user: { id: "u1", name: "Admin" } }

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/card-series", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function makeSeriesRow(overrides = {}) {
  return {
    id: "s1",
    name: "Panini 2026",
    year: 2026,
    sport: "football",
    tier: "regular",
    displayMode: "missing_only",
    totalCardsCount: 500,
    imageUrl: null,
    pricePerCard: null,
    isPricingEnabled: false,
    slug: "panini-2026",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    cards: [],
    tags: [],
    ...overrides,
  }
}

beforeEach(() => {
  mockAuth.mockReset()
  mockCardSeries.findMany.mockReset()
  mockCardSeries.findUnique.mockReset()
  mockCardSeries.create.mockReset()
})

// ── GET ───────────────────────────────────────────────────────────────────────

describe("GET /api/card-series", () => {
  it("returns empty array when no series exist", async () => {
    mockCardSeries.findMany.mockResolvedValue([])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it("returns serialized series list with owned/total counts", async () => {
    mockCardSeries.findMany.mockResolvedValue([
      makeSeriesRow({
        cards: [
          { variants: [{ isOwned: true }, { isOwned: false }] },
          { variants: [{ isOwned: true }] },
        ],
      }),
    ])
    const body = await (await GET()).json()
    expect(body).toHaveLength(1)
    expect(body[0].ownedVariantsCount).toBe(2)
    expect(body[0].totalVariantsCount).toBe(3)
  })

  it("serializes dates to ISO strings", async () => {
    mockCardSeries.findMany.mockResolvedValue([makeSeriesRow()])
    const body = await (await GET()).json()
    expect(body[0].createdAt).toBe("2026-01-01T00:00:00.000Z")
    expect(body[0].updatedAt).toBe("2026-01-01T00:00:00.000Z")
  })

  it("includes tags in response with serialized dates", async () => {
    mockCardSeries.findMany.mockResolvedValue([
      makeSeriesRow({
        tags: [{ id: "t1", name: "Limitovaná", color: "#ff0000", symbol: "⭐", createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") }],
      }),
    ])
    const body = await (await GET()).json()
    expect(body[0].tags).toHaveLength(1)
    expect(body[0].tags[0].name).toBe("Limitovaná")
    expect(typeof body[0].tags[0].createdAt).toBe("string")
  })
})

// ── POST ──────────────────────────────────────────────────────────────────────

describe("POST /api/card-series", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(req({ name: "Test", year: 2026 }))
    expect(res.status).toBe(401)
  })

  it("returns 400 when name is missing", async () => {
    mockAuth.mockResolvedValue(SESSION)
    const res = await POST(req({ year: 2026 }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/missing/i)
  })

  it("returns 400 when year is missing", async () => {
    mockAuth.mockResolvedValue(SESSION)
    const res = await POST(req({ name: "Test" }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/missing/i)
  })

  it("creates series with correct defaults", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.findUnique.mockResolvedValue(null)
    mockCardSeries.create.mockResolvedValue(makeSeriesRow())

    const res = await POST(req({ name: "Panini 2026", year: 2026 }))
    expect(res.status).toBe(201)
    expect(mockCardSeries.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Panini 2026",
          year: 2026,
          sport: "football",
          tier: "regular",
          displayMode: "missing_only",
          totalCardsCount: 0,
          isPricingEnabled: false,
        }),
      })
    )
  })

  it("creates series with explicit sport, tier, and pricing", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.findUnique.mockResolvedValue(null)
    mockCardSeries.create.mockResolvedValue(makeSeriesRow({ sport: "hockey", tier: "premium", pricePerCard: 25, isPricingEnabled: true }))

    await POST(req({ name: "Upper Deck", year: 2026, sport: "hockey", tier: "premium", pricePerCard: 25, isPricingEnabled: true }))

    expect(mockCardSeries.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sport: "hockey", tier: "premium", pricePerCard: 25, isPricingEnabled: true }),
      })
    )
  })

  it("appends timestamp to slug on collision", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.findUnique.mockResolvedValue({ id: "existing" })
    mockCardSeries.create.mockResolvedValue(makeSeriesRow())

    await POST(req({ name: "Panini 2026", year: 2026 }))
    const slug = mockCardSeries.create.mock.calls[0][0].data.slug
    expect(slug).toMatch(/panini-2026-\d+/)
  })

  it("connects tags when tagIds provided", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.findUnique.mockResolvedValue(null)
    mockCardSeries.create.mockResolvedValue(makeSeriesRow())

    await POST(req({ name: "Test", year: 2026, tagIds: ["t1", "t2"] }))
    const data = mockCardSeries.create.mock.calls[0][0].data
    expect(data.tags).toEqual({ connect: [{ id: "t1" }, { id: "t2" }] })
  })

  it("returns 201 with id and serialized dates", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.findUnique.mockResolvedValue(null)
    mockCardSeries.create.mockResolvedValue(makeSeriesRow())

    const res = await POST(req({ name: "Panini 2026", year: 2026 }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe("s1")
    expect(typeof body.createdAt).toBe("string")
    expect(Array.isArray(body.tags)).toBe(true)
  })
})
