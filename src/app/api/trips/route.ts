import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slugify"

export async function GET() {
  const trips = await prisma.trip.findMany({
    orderBy: { startDate: "desc" },
    include: { stops: { orderBy: { order: "asc" } } },
  })
  return NextResponse.json(trips)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, description, startDate, endDate, coverPhoto, coverPhotoFocus, participants, published, country, tripType, tips } = body

  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  let slug = slugify(title)
  // ensure unique slug
  const existing = await prisma.trip.findUnique({ where: { slug } })
  if (existing) {
    slug = `${slug}-${Date.now()}`
  }

  const trip = await prisma.trip.create({
    data: {
      slug,
      title,
      description: description || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      coverPhoto: coverPhoto || null,
      coverPhotoFocus: coverPhotoFocus || null,
      participants: JSON.stringify(participants || []),
      published: published || false,
      country: country || null,
      tripType: tripType || null,
      tips: tips || null,
    },
  })

  return NextResponse.json(trip, { status: 201 })
}
