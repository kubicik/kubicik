# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: This is Next.js 16

Next.js 16 has breaking changes from earlier versions. Read `node_modules/next/dist/docs/` before writing code. Key difference: `src/middleware.ts` is deprecated in favour of `src/proxy.ts`, but **use `middleware.ts` on Vercel** — Vercel does not yet support the `proxy.ts` convention.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # prisma migrate deploy + seed + next build
npm run db:seed      # Create admin user (admin/admin) if missing
npx prisma migrate dev --name <name>   # Create a new migration
npx prisma studio                      # Browse the database
```

## Environment Variables

```
DATABASE_URL=file:./dev.db        # local SQLite (default fallback)
DATABASE_URL=libsql://xxx.turso.io  # Turso remote (production)
TURSO_AUTH_TOKEN=eyJ...             # required when using Turso
AUTH_SECRET=<random-string>         # NextAuth JWT secret
```

`DATABASE_URL` has a hardcoded fallback to `file:<cwd>/dev.db` in `prisma.config.ts`, `src/lib/prisma.ts`, and `src/auth.ts`, so local dev works without `.env`.

## Architecture

### Database (Prisma 7 + libSQL)

**Prisma 7 is structurally different from earlier versions:**
- `datasource.url` is NOT in `schema.prisma` — it lives in `prisma.config.ts`
- The generated client outputs to `src/generated/prisma/` (not `node_modules`)
- Import from `@/generated/prisma/client`, not `@prisma/client`
- The adapter (`PrismaLibSql`) takes `{ url, authToken? }` directly — do **not** call `createClient()` manually

The SQLite file is `dev.db` in the **project root**, not inside `prisma/`. The `prisma.config.ts` datasource URL resolves relative to `process.cwd()`, which is the project root during both build and runtime.

`Trip.participants` is stored as a JSON string (`"[]"`). Parse/stringify at every API boundary — there is no ORM-level transform.

### Auth (NextAuth v5 beta)

Split into two files to satisfy Edge Runtime constraints:
- `src/auth.config.ts` — Edge-safe config (no Node.js imports). Used by `middleware.ts` for JWT validation only.
- `src/auth.ts` — Full config with `Credentials` provider, bcrypt, and Prisma. Used by server components and API routes.

In server components: `const session = await auth()` (imported from `@/auth`).  
In client components: `useSession()` from `next-auth/react` (wrapped by `src/components/providers.tsx`).

### Route Structure

```
src/app/
  (public)/          # No auth — layout has nav + footer
    page.tsx         # Homepage: published trips grid
    trips/[slug]/    # Trip detail: hero, map, stop timeline
  (admin)/           # Auth required — layout has sidebar
    admin/
      trips/[id]/stops/  # Map-based stop editor (most complex page)
  api/               # REST endpoints; all protected except GET /api/trips
  auth/signin/       # Custom credentials login page
```

Route groups `(public)` and `(admin)` share the root `layout.tsx` but have separate nested layouts. There is **no** `src/app/page.tsx` — the homepage is served entirely by `(public)/page.tsx`.

### Map Components

All Leaflet/react-leaflet components must be `"use client"` and dynamically imported with `ssr: false`. Leaflet marker icons are fixed in each map component via `L.Icon.Default.mergeOptions` pointing to `/public/leaflet/`. Map containers require an explicit pixel height — percentage heights render invisible.

### File Uploads

`POST /api/upload` accepts `multipart/form-data` with fields `file` (File) and `type` (`"covers"` | `"stops"`). Files are written to `public/uploads/{type}/`. On Vercel the filesystem is read-only at runtime — use Turso for DB and a separate object store (e.g. Vercel Blob) for uploads if persistence is needed.
