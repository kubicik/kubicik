import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// vi.mock is hoisted before imports — intercepts both static and dynamic imports
const mockPut = vi.fn()
vi.mock("@vercel/blob", () => ({ put: mockPut }))

const mockWriteFile = vi.fn()
const mockMkdir = vi.fn()
vi.mock("fs/promises", () => ({
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}))

import { POST } from "../route"

// ── helpers ──────────────────────────────────────────────────────────────────

function makeFile(content = "x", name = "photo.jpg", type = "image/jpeg"): File {
  return new File([content], name, { type })
}

async function makeRequest(file: File, uploadType = "stops"): Promise<NextRequest> {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("type", uploadType)
  return new NextRequest("http://localhost/api/upload", { method: "POST", body: fd })
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  delete process.env.BLOB_READ_WRITE_TOKEN
  delete process.env.VERCEL
  mockPut.mockReset()
  mockWriteFile.mockResolvedValue(undefined)
  mockMkdir.mockResolvedValue(undefined)
})

// ── validation ────────────────────────────────────────────────────────────────

describe("validation", () => {
  it("returns 400 when no file is provided", async () => {
    const fd = new FormData()
    const req = new NextRequest("http://localhost/api/upload", { method: "POST", body: fd })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/no file/i)
  })

  it("returns 400 for disallowed MIME type", async () => {
    const req = await makeRequest(makeFile("data", "doc.pdf", "application/pdf"))
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/invalid file type/i)
  })

  it("returns 413 when file exceeds 5 MB", async () => {
    const bigContent = "a".repeat(5 * 1024 * 1024 + 1)
    const req = await makeRequest(makeFile(bigContent, "big.jpg", "image/jpeg"))
    const res = await POST(req)
    expect(res.status).toBe(413)
  })
})

// ── filesystem path ───────────────────────────────────────────────────────────

describe("filesystem path (local dev)", () => {
  it("returns 200 with /uploads/stops/… url", async () => {
    const res = await POST(await makeRequest(makeFile(), "stops"))
    expect(res.status).toBe(200)
    expect((await res.json()).url).toMatch(/^\/uploads\/stops\//)
  })

  it("returns 200 with /uploads/covers/… url for covers type", async () => {
    const res = await POST(await makeRequest(makeFile(), "covers"))
    expect(res.status).toBe(200)
    expect((await res.json()).url).toMatch(/^\/uploads\/covers\//)
  })

  it("defaults unknown type to stops", async () => {
    const res = await POST(await makeRequest(makeFile(), "unknown"))
    expect(res.status).toBe(200)
    expect((await res.json()).url).toMatch(/^\/uploads\/stops\//)
  })
})

// ── Vercel Blob path ──────────────────────────────────────────────────────────

describe("Vercel Blob path (BLOB_READ_WRITE_TOKEN set)", () => {
  beforeEach(() => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token"
  })

  it("returns 200 with blob URL on success", async () => {
    mockPut.mockResolvedValue({ url: "https://example.public.blob.vercel-storage.com/test.webp" })
    const res = await POST(await makeRequest(makeFile()))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe("https://example.public.blob.vercel-storage.com/test.webp")
    expect(mockPut).toHaveBeenCalledOnce()
  })

  it("returns 500 with error message when put() throws", async () => {
    mockPut.mockRejectedValue(new Error("Blob service unavailable"))
    const res = await POST(await makeRequest(makeFile()))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/Blob service unavailable/)
  })
})

// ── Vercel without Blob configured ────────────────────────────────────────────

describe("Vercel runtime without Blob configured", () => {
  it("returns 503 with actionable message instead of crashing", async () => {
    process.env.VERCEL = "1"
    const res = await POST(await makeRequest(makeFile()))
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toMatch(/BLOB_READ_WRITE_TOKEN/i)
  })
})
