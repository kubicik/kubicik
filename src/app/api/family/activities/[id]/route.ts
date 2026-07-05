import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const activity = await prisma.activity.update({
    where: { id },
    data: {
      childId: body.childId,
      name: body.name,
      dayOfWeek: Number(body.dayOfWeek),
      startTime: body.startTime,
      endTime: body.endTime,
      location: body.location || null,
      color: body.color || null,
    },
    include: { child: true },
  })
  return NextResponse.json(activity)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.activity.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
