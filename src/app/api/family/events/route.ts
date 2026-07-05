import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get("year")
  const month = searchParams.get("month")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let where: any = {}
  if (year && month) {
    const from = new Date(Number(year), Number(month) - 1, 1)
    const to = new Date(Number(year), Number(month), 0, 23, 59, 59)
    where = {
      AND: [
        { startDate: { lte: to } },
        { endDate: { gte: from } },
      ],
    }
  }

  const events = await prisma.familyEvent.findMany({
    where,
    orderBy: { startDate: "asc" },
    include: { child: true },
  })
  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const event = await prisma.familyEvent.create({
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
  return NextResponse.json(event, { status: 201 })
}
