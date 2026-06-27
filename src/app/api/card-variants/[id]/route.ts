import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const data: { isOwned?: boolean; price?: number | null } = {}
  if ("isOwned" in body) data.isOwned = Boolean(body.isOwned)
  if ("price" in body) data.price = body.price != null ? Number(body.price) : null

  const variant = await prisma.cardVariant.update({
    where: { id },
    data,
  })
  return NextResponse.json({
    ...variant,
    createdAt: variant.createdAt.toISOString(),
    updatedAt: variant.updatedAt.toISOString(),
  })
}
