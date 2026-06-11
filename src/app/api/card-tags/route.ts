import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const tags = await prisma.cardTag.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json(tags.map((t) => ({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, color, symbol } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Název je povinný" }, { status: 400 })

  const tag = await prisma.cardTag.create({
    data: { name: name.trim(), color: color || "#007aff", symbol: symbol?.trim() || "🏷️" },
  })
  return NextResponse.json({ ...tag, createdAt: tag.createdAt.toISOString(), updatedAt: tag.updatedAt.toISOString() }, { status: 201 })
}
