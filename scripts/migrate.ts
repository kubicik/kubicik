/**
 * Custom migration runner for libsql/Turso.
 * Prisma's built-in `migrate deploy` only supports `file:` URLs.
 * This script reads the SQL migration files and applies them via @libsql/client,
 * which works with both local SQLite (file:) and Turso (libsql://).
 */
import { createClient } from "@libsql/client"
import { readFileSync, readdirSync } from "fs"
import path from "path"
import crypto from "crypto"

async function main() {
  const url =
    process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "dev.db")}`
  const authToken = process.env.TURSO_AUTH_TOKEN

  const client = createClient(authToken ? { url, authToken } : { url })

  // Ensure migrations tracking table exists (matches Prisma's schema)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id                VARCHAR(36)  NOT NULL PRIMARY KEY,
      checksum          VARCHAR(64)  NOT NULL,
      finished_at       DATETIME,
      migration_name    VARCHAR(255) NOT NULL,
      logs              TEXT,
      rolled_back_at    DATETIME,
      started_at        DATETIME     NOT NULL DEFAULT current_timestamp,
      applied_steps_count INTEGER    NOT NULL DEFAULT 0
    )
  `)

  // Which migrations have already been applied?
  const result = await client.execute(
    "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL"
  )
  const applied = new Set(result.rows.map((r) => r.migration_name as string))

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations")
  const dirs = readdirSync(migrationsDir)
    .filter((d) => !d.endsWith(".toml"))
    .sort()

  for (const dir of dirs) {
    if (applied.has(dir)) {
      console.log(`  skip  ${dir}`)
      continue
    }

    const sqlFile = path.join(migrationsDir, dir, "migration.sql")
    const sql = readFileSync(sqlFile, "utf-8")

    // Split on semicolons, skip empty statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)

    await client.batch(
      statements.map((s) => ({ sql: s, args: [] })),
      "write"
    )

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await client.execute({
      sql: `INSERT INTO _prisma_migrations
              (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, "manual", now, dir, now, 1],
    })

    console.log(`  apply ${dir}`)
  }

  console.log("Migrations done.")
  await client.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
