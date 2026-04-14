import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

// Covers: wider max (hero images), Stops: slightly smaller
const RESIZE: Record<string, { width: number; height: number }> = {
  covers: { width: 2400, height: 1600 },
  stops:  { width: 1800, height: 1800 },
}

async function optimise(buffer: Buffer, type: string): Promise<{ data: Buffer; ext: string }> {
  const { width, height } = RESIZE[type] ?? RESIZE.stops

  // GIFs: pass through unchanged (animated GIF support in sharp is limited)
  const meta = await sharp(buffer).metadata()
  if (meta.format === "gif") return { data: buffer, ext: "gif" }

  const data = await sharp(buffer)
    .rotate()                             // honour EXIF orientation
    .resize(width, height, {
      fit: "inside",                      // never upscale, keep aspect ratio
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 4 })    // quality 82 = visually lossless for photos
    .toBuffer()

  return { data, ext: "webp" }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const type = (formData.get("type") as string) || "stops"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Soubor je příliš velký (max 20 MB)" }, { status: 413 })
    }

    const uploadType = ["covers", "stops"].includes(type) ? type : "stops"
    const rawBuffer = Buffer.from(await file.arrayBuffer())
    const { data: optimised, ext } = await optimise(rawBuffer, uploadType)

    const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")
    const filename = `${Date.now()}-${baseName}.${ext}`

    // Vercel Blob in production
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob")
      const blob = await put(`uploads/${uploadType}/${filename}`, optimised, {
        access: "public",
        contentType: ext === "gif" ? "image/gif" : "image/webp",
      })
      return NextResponse.json({ url: blob.url })
    }

    // Local filesystem fallback
    const { writeFile, mkdir } = await import("fs/promises")
    const path = await import("path")
    const uploadDir = path.join(process.cwd(), "public", "uploads", uploadType)
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), optimised)
    return NextResponse.json({ url: `/uploads/${uploadType}/${filename}` })
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
