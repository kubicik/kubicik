import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  const user = await prisma.user.findFirst({
    where: { role: "family" },
    select: { id: true, username: true, name: true },
  })
  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { username, password } = body

  const familyUser = await prisma.user.findFirst({ where: { role: "family" } })
  if (!familyUser) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {}
  if (username?.trim()) {
    const conflict = await prisma.user.findUnique({ where: { username: username.trim() } })
    if (conflict && conflict.id !== familyUser.id) {
      return NextResponse.json({ error: "Uživatelské jméno je již obsazeno" }, { status: 409 })
    }
    data.username = username.trim()
  }
  if (password?.trim()) {
    data.password = await bcrypt.hash(password.trim(), 12)
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: familyUser.id },
    data,
    select: { id: true, username: true, name: true },
  })
  return NextResponse.json(updated)
}
