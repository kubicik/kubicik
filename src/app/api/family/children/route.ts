import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const children = await prisma.familyChild.findMany({ orderBy: { order: "asc" } })
  return NextResponse.json(children)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const child = await prisma.familyChild.create({
    data: {
      name: body.name,
      color: body.color ?? "#007aff",
      order: body.order ?? 0,
    },
  })
  return NextResponse.json(child, { status: 201 })
}
