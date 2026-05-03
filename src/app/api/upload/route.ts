import { NextRequest, NextResponse } from "next/server"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
// Client compresses to ≤ 3.5 MB; allow a small margin
const MAX_BYTES = 5 * 1024 * 1024

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
      return NextResponse.json({ error: "Upload se nepodařil — soubor je příliš velký" }, { status: 413 })
    }

    const uploadType = ["covers", "stops", "matches"].includes(type) ? type : "stops"
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const filename = `${Date.now()}-${safeName}`

    // Read file into Buffer once — needed for both storage paths
    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType = file.type || "image/webp"

    // Vercel Blob in production
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import("@vercel/blob")
        const blob = await put(`uploads/${uploadType}/${filename}`, buffer, {
          access: "public",
          contentType,
        })
        return NextResponse.json({ url: blob.url })
      } catch (blobErr) {
        console.error("Vercel Blob upload error:", blobErr)
        return NextResponse.json(
          { error: `Blob upload failed: ${blobErr instanceof Error ? blobErr.message : String(blobErr)}` },
          { status: 500 }
        )
      }
    }

    // Vercel runtime without Blob configured → clear 503 instead of cryptic FS error
    if (process.env.VERCEL) {
      return NextResponse.json(
        { error: "File storage is not configured. Set BLOB_READ_WRITE_TOKEN in Vercel environment variables." },
        { status: 503 }
      )
    }

    // Local filesystem fallback (development only)
    const { writeFile, mkdir } = await import("fs/promises")
    const path = await import("path")
    const uploadDir = path.join(process.cwd(), "public", "uploads", uploadType)
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), buffer)
    return NextResponse.json({ url: `/uploads/${uploadType}/${filename}` })
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json(
      { error: `Upload failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
