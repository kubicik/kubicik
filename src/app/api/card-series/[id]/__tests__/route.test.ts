import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ── mocks ─────────────────────────────────────────────────────────────────────

const { mockCardSeries, mockAuth } = vi.hoisted(() => ({
  mockCardSeries: {
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mockAuth: vi.fn(),
}))

vi.mock("@/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/sortCards", () => ({ sortCards: <T>(arr: T[]) => arr }))
vi.mock("@/lib/prisma", () => ({ prisma: { cardSeries: mockCardSeries } }))

import { GET, PUT, DELETE } from "../route"

// ── helpers ───────────────────────────────────────────────────────────────────

const SESSION = { user: { id: "u1", name: "Admin" } }

function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makeGetReq(id: string) {
  return new NextRequest(`http://localhost/api/card-series/${id}`)
}

function makeDelReq(id: string) {
  return new NextRequest(`http://localhost/api/card-series/${id}`, { method: "DELETE" })
}

function makePutReq(id: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/card-series/${id}`, {
    method: "PUT",
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
    isPricingEnabled: false,
    collectBase: true,
    slug: "panini-2026",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    subsets: [],
    tags: [],
    ...overrides,
  }
}

beforeEach(() => {
  mockAuth.mockReset()
  mockCardSeries.findUnique.mockReset()
  mockCardSeries.update.mockReset()
  mockCardSeries.delete.mockReset()
})

// ── GET /[id] ─────────────────────────────────────────────────────────────────

describe("GET /api/card-series/[id]", () => {
  it("returns 404 when series not found", async () => {
    mockCardSeries.findUnique.mockResolvedValue(null)
    const res = await GET(makeGetReq("missing"), params("missing"))
    expect(res.status).toBe(404)
    expect((await res.json()).error).toMatch(/not found/i)
  })

  it("returns series with ISO date strings", async () => {
    mockCardSeries.findUnique.mockResolvedValue(makeSeriesRow())
    const res = await GET(makeGetReq("s1"), params("s1"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe("s1")
    expect(body.createdAt).toBe("2026-01-01T00:00:00.000Z")
  })

  it("serializes nested subset, card and variant dates", async () => {
    mockCardSeries.findUnique.mockResolvedValue(
      makeSeriesRow({
        subsets: [{
          id: "sub1", seriesId: "s1", name: "Base", isSpecial: false, order: 0,
          createdAt: new Date("2026-01-01"),
          parallels: [],
          cards: [{
            id: "c1", subsetId: "sub1", number: "1", name: "Haaland", order: 0, imageUrl: null,
            createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"),
            variants: [{
              id: "v1", cardId: "c1", parallelId: "p1", isOwned: true, price: null,
              parallel: { id: "p1", subsetId: "sub1", name: "Base", limitNumber: null, isCollected: true, order: 0 },
              createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-02"),
            }],
          }],
        }],
      })
    )
    const body = await (await GET(makeGetReq("s1"), params("s1"))).json()
    expect(body.subsets[0].createdAt).toBe("2026-01-01T00:00:00.000Z")
    expect(body.subsets[0].cards[0].createdAt).toBe("2026-01-01T00:00:00.000Z")
    expect(body.subsets[0].cards[0].variants[0].updatedAt).toBe("2026-01-02T00:00:00.000Z")
  })

  it("includes tags with serialized dates", async () => {
    mockCardSeries.findUnique.mockResolvedValue(
      makeSeriesRow({
        tags: [{ id: "t1", name: "Rare", color: "#ff0000", symbol: "⭐", createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") }],
      })
    )
    const body = await (await GET(makeGetReq("s1"), params("s1"))).json()
    expect(body.tags[0].name).toBe("Rare")
    expect(typeof body.tags[0].createdAt).toBe("string")
  })
})

// ── PUT /[id] ─────────────────────────────────────────────────────────────────

describe("PUT /api/card-series/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PUT(makePutReq("s1", {}), params("s1"))
    expect(res.status).toBe(401)
  })

  it("updates name when provided", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.update.mockResolvedValue(makeSeriesRow({ name: "Nový název" }))
    await PUT(makePutReq("s1", { name: "Nový název" }), params("s1"))
    expect(mockCardSeries.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "s1" }, data: expect.objectContaining({ name: "Nový název" }) })
    )
  })

  it("coerces year and totalCardsCount to numbers", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.update.mockResolvedValue(makeSeriesRow())
    await PUT(makePutReq("s1", { year: "2025", totalCardsCount: "300" }), params("s1"))
    const data = mockCardSeries.update.mock.calls[0][0].data
    expect(data.year).toBe(2025)
    expect(data.totalCardsCount).toBe(300)
  })

  it("updates sport and tier", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.update.mockResolvedValue(makeSeriesRow({ sport: "hockey", tier: "premium" }))
    await PUT(makePutReq("s1", { sport: "hockey", tier: "premium" }), params("s1"))
    const data = mockCardSeries.update.mock.calls[0][0].data
    expect(data.sport).toBe("hockey")
    expect(data.tier).toBe("premium")
  })

  it("enables isPricingEnabled flag", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.update.mockResolvedValue(makeSeriesRow({ isPricingEnabled: true }))
    await PUT(makePutReq("s1", { isPricingEnabled: true }), params("s1"))
    const data = mockCardSeries.update.mock.calls[0][0].data
    expect(data.isPricingEnabled).toBe(true)
  })

  it("disables isPricingEnabled flag", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.update.mockResolvedValue(makeSeriesRow({ isPricingEnabled: false }))
    await PUT(makePutReq("s1", { isPricingEnabled: false }), params("s1"))
    expect(mockCardSeries.update.mock.calls[0][0].data.isPricingEnabled).toBe(false)
  })

  it("sets tags via set when tagIds provided", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.update.mockResolvedValue(makeSeriesRow())
    await PUT(makePutReq("s1", { tagIds: ["t1", "t2"] }), params("s1"))
    expect(mockCardSeries.update.mock.calls[0][0].data.tags).toEqual({ set: [{ id: "t1" }, { id: "t2" }] })
  })

  it("clears all tags when tagIds is empty array", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.update.mockResolvedValue(makeSeriesRow())
    await PUT(makePutReq("s1", { tagIds: [] }), params("s1"))
    expect(mockCardSeries.update.mock.calls[0][0].data.tags).toEqual({ set: [] })
  })

  it("does not include tags in update when tagIds is undefined", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.update.mockResolvedValue(makeSeriesRow())
    await PUT(makePutReq("s1", { name: "Only rename" }), params("s1"))
    expect(mockCardSeries.update.mock.calls[0][0].data.tags).toBeUndefined()
  })

  it("returns 200 with serialized body", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.update.mockResolvedValue(makeSeriesRow({ name: "Updated" }))
    const res = await PUT(makePutReq("s1", { name: "Updated" }), params("s1"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe("Updated")
    expect(typeof body.updatedAt).toBe("string")
  })
})

// ── DELETE /[id] ──────────────────────────────────────────────────────────────

describe("DELETE /api/card-series/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(makeDelReq("s1"), params("s1"))
    expect(res.status).toBe(401)
  })

  it("deletes series by id and returns ok", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSeries.delete.mockResolvedValue({})
    const res = await DELETE(makeDelReq("s1"), params("s1"))
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
    expect(mockCardSeries.delete).toHaveBeenCalledWith({ where: { id: "s1" } })
  })
})
