import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { mockCardSubset, mockAuth } = vi.hoisted(() => ({
  mockCardSubset: { update: vi.fn(), delete: vi.fn() },
  mockAuth: vi.fn(),
}))

vi.mock("@/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/prisma", () => ({ prisma: { cardSubset: mockCardSubset } }))

import { PUT, DELETE } from "../route"

const SESSION = { user: { id: "u1", name: "Admin" } }

function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

function putReq(id: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/card-subsets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function delReq(id: string): NextRequest {
  return new NextRequest(`http://localhost/api/card-subsets/${id}`, { method: "DELETE" })
}

function makeSubsetRow(overrides = {}) {
  return {
    id: "sub1", seriesId: "s1", name: "Base", isSpecial: false, order: 0,
    createdAt: new Date("2026-01-01"),
    ...overrides,
  }
}

beforeEach(() => {
  mockAuth.mockReset()
  mockCardSubset.update.mockReset()
  mockCardSubset.delete.mockReset()
})

describe("PUT /api/card-subsets/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PUT(putReq("sub1", { name: "New" }), params("sub1"))
    expect(res.status).toBe(401)
  })

  it("updates subset name", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.update.mockResolvedValue(makeSubsetRow({ name: "Gold Inserts" }))
    await PUT(putReq("sub1", { name: "Gold Inserts" }), params("sub1"))
    expect(mockCardSubset.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "sub1" }, data: expect.objectContaining({ name: "Gold Inserts" }) })
    )
  })

  it("toggles isSpecial from false to true", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.update.mockResolvedValue(makeSubsetRow({ isSpecial: true }))
    await PUT(putReq("sub1", { isSpecial: true }), params("sub1"))
    expect(mockCardSubset.update.mock.calls[0][0].data.isSpecial).toBe(true)
  })

  it("toggles isSpecial from true to false", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.update.mockResolvedValue(makeSubsetRow({ isSpecial: false }))
    await PUT(putReq("sub1", { isSpecial: false }), params("sub1"))
    expect(mockCardSubset.update.mock.calls[0][0].data.isSpecial).toBe(false)
  })

  it("does not update isSpecial when not provided", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.update.mockResolvedValue(makeSubsetRow())
    await PUT(putReq("sub1", { name: "Only rename" }), params("sub1"))
    expect(mockCardSubset.update.mock.calls[0][0].data.isSpecial).toBeUndefined()
  })

  it("returns 200 with serialized createdAt", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.update.mockResolvedValue(makeSubsetRow({ name: "Updated" }))
    const res = await PUT(putReq("sub1", { name: "Updated" }), params("sub1"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe("Updated")
    expect(typeof body.createdAt).toBe("string")
  })
})

describe("DELETE /api/card-subsets/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(delReq("sub1"), params("sub1"))
    expect(res.status).toBe(401)
  })

  it("deletes subset and returns ok", async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockCardSubset.delete.mockResolvedValue({})
    const res = await DELETE(delReq("sub1"), params("sub1"))
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
    expect(mockCardSubset.delete).toHaveBeenCalledWith({ where: { id: "sub1" } })
  })
})
