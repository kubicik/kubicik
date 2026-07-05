import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const event = await prisma.familyEvent.update({
    where: { id },
    data: {
      childId: body.childId || null,
      title: body.title,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      color: body.color || null,
      note: body.note || null,
    },
    include: { child: true },
  })
  return NextResponse.json(event)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.familyEvent.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
