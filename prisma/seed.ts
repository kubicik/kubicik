import bcrypt from "bcryptjs"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import path from "path"

const url =
  process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "dev.db")}`
const authToken = process.env.TURSO_AUTH_TOKEN
const adapter = new PrismaLibSql(authToken ? { url, authToken } : { url })
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: "admin" } })
  if (!existing) {
    const hashed = await bcrypt.hash("admin", 12)
    await prisma.user.create({
      data: { username: "admin", password: hashed, name: "Admin", role: "admin", email: "admin@kubicik.cz" },
    })
    console.log("Admin user created (admin/admin) – email: admin@kubicik.cz")
  } else {
    if (!existing.email) {
      await prisma.user.update({ where: { id: existing.id }, data: { email: "admin@kubicik.cz" } })
      console.log("Admin email backfilled to admin@kubicik.cz")
    } else {
      console.log("Admin user already exists")
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
