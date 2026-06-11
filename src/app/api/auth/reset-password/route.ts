import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password || password.length < 6) {
    return NextResponse.json({ error: "Neplatný požadavek" }, { status: 400 })
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token je neplatný nebo vypršel" }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
    prisma.passwordResetToken.delete({ where: { id: record.id } }),
  ])

  return NextResponse.json({ ok: true })
}
