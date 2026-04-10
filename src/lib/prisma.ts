import { PrismaClient } from "@/generated/prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import path from "path"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function getDbUrl(): string {
  const envUrl = process.env.DATABASE_URL
  if (envUrl) return envUrl
  const dbPath = path.join(process.cwd(), "dev.db")
  return `file:${dbPath}`
}

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url: getDbUrl() })
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
