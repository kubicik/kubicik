import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";

const url =
  process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "dev.db")}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: { url },
});
