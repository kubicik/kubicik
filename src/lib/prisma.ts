import { PrismaClient } from "@/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import path from "path"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function getDbUrl(): string {
  // Use DATABASE_URL from environment if set (production deployments)
  const envUrl = process.env.DATABASE_URL
  if (envUrl) return envUrl
  // Fallback to local dev.db next to the project root
  const dbPath = path.join(process.cwd(), "dev.db")
  return `file:${dbPath}`
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: getDbUrl() })
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
