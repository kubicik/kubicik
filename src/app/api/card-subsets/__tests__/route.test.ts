import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { mockCardSubset, mockAuth } = vi.hoisted(() => ({
  mockCardSubset: { create: vi.fn() },
  mockAuth: vi.fn(),
}))

vi.mock("@/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/prisma", () => ({ prisma: { cardSubset: mockCardSubset } }))

import { POST } from "../route"

const SESSION = { user: { id: "u1", name: "Admin" } }

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/card-subsets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function makeSubsetRow(overrides = {}) {
  return {
    id: "sub1", seriesId: "s1", name: "Base", isSpecial: false, order: 0,
    createdAt: new Date("2026-01-01"),
    parallels: [], cards: [],
    ...overrides,
  }
}

beforeEach(() => {
  mockAuth.mockReset()
  mockCardSubset.create.mockReset()
})

describe("POST /api/card-subsets", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(req({ seriesId: "s1", name: "Base" }))
    expect(res.status).toBe(401)
  })

  it("returns 400 when seriesId is missing", async () => {
    mockAuth.mockResolvedValue(SESSION)
    const res = await POST(req({ name: "Base" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 when name is missing", async () => {
    mockAuth.mockResolvedValue(SESSION)
    const res = await POST(req({ seriesId: "s1" }))
    expect(res.status).toBe(400)
  })

  it("creates base subset with isSpecial false by default", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.create.mockResolvedValue(makeSubsetRow())
    const res = await POST(req({ seriesId: "s1", name: "Base", order: 0 }))
    expect(res.status).toBe(201)
    expect(mockCardSubset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ seriesId: "s1", name: "Base", isSpecial: false, order: 0 }),
      })
    )
  })

  it("creates special subset when isSpecial is true", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.create.mockResolvedValue(makeSubsetRow({ name: "Gold Inserts", isSpecial: true }))
    await POST(req({ seriesId: "s1", name: "Gold Inserts", isSpecial: true }))
    expect(mockCardSubset.create.mock.calls[0][0].data.isSpecial).toBe(true)
  })

  it("returns 201 with serialized createdAt", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.create.mockResolvedValue(makeSubsetRow())
    const res = await POST(req({ seriesId: "s1", name: "Base" }))
    const body = await res.json()
    expect(body.id).toBe("sub1")
    expect(typeof body.createdAt).toBe("string")
    expect(body.parallels).toEqual([])
    expect(body.cards).toEqual([])
  })
})
