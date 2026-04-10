import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params
  await prisma.photo.delete({ where: { id: photoId } })
  return NextResponse.json({ ok: true })
}
