import bcrypt from "bcryptjs"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import path from "path"

const dbPath = path.join(__dirname, "..", "dev.db")
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: "admin" } })
  if (!existing) {
    const hashed = await bcrypt.hash("admin", 12)
    await prisma.user.create({
      data: {
        username: "admin",
        password: hashed,
        name: "Admin",
        role: "admin",
      },
    })
    console.log("Admin user created (admin/admin)")
  } else {
    console.log("Admin user already exists")
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
