import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const activities = await prisma.activity.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: { child: true },
  })
  return NextResponse.json(activities)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const activity = await prisma.activity.create({
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
  return NextResponse.json(activity, { status: 201 })
}
