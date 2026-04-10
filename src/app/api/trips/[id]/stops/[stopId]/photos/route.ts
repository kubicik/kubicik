import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; stopId: string; photoId?: string }> }
) {
  const url = _req.nextUrl
  const photoId = url.searchParams.get("photoId")
  if (!photoId) return NextResponse.json({ error: "Missing photoId" }, { status: 400 })
  await prisma.photo.delete({ where: { id: photoId } })
  return NextResponse.json({ ok: true })
}
