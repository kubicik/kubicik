import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "@/generated/prisma/client"
import path from "path"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Heslo", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const url =
          process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "dev.db")}`
        const authToken = process.env.TURSO_AUTH_TOKEN
        const adapter = new PrismaLibSql(authToken ? { url, authToken } : { url })
        const db = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

        try {
          const emailVal = (credentials.email as string).toLowerCase().trim()
          // Find by email first, fall back to username for backward compatibility
          const user =
            (await db.user.findFirst({ where: { email: emailVal } })) ??
            (await db.user.findUnique({ where: { username: emailVal } }))
          if (!user) return null

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )
          if (!valid) return null

          return { id: user.id, name: user.name, email: user.email ?? user.username }
        } finally {
          await db.$disconnect()
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) (session.user as { id?: string }).id = token.id as string
      return session
    },
  },
})
