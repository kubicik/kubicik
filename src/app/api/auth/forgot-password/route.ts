import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "Email je povinný" }, { status: 400 })

  const user = await prisma.user.findFirst({ where: { email: email.toLowerCase().trim() } })
  // Always return 200 to avoid user enumeration
  if (!user) return NextResponse.json({ ok: true })

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`

  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "noreply@kubicik.cz",
        to: user.email,
        subject: "Obnovení hesla – Kubicik Travel",
        html: `<p>Dobrý den,</p>
<p>klikněte na odkaz níže pro nastavení nového hesla. Odkaz je platný 1 hodinu.</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>Pokud jste o obnovení hesla nežádali, tento email ignorujte.</p>`,
      }),
    })
  } else {
    console.log("[dev] Password reset link:", resetUrl)
  }

  return NextResponse.json({ ok: true })
}
