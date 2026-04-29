# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: This is Next.js 16

Next.js 16 has breaking changes from earlier versions. Read `node_modules/next/dist/docs/` before writing code. Key difference: `src/middleware.ts` is deprecated in favour of `src/proxy.ts`, but **use `middleware.ts` on Vercel** — Vercel does not yet support the `proxy.ts` convention.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # migrate + seed + import sample data + next build
npm run db:seed      # Create admin user (admin/admin) if missing
npm test             # Run Vitest test suite (once)
npm run test:watch   # Run Vitest in watch mode
npx vitest run src/app/api/upload/__tests__/route.test.ts  # Run a single test file
npx prisma migrate dev --name <name>   # Create a new migration
npx prisma studio                      # Browse the database
```

## Environment Variables

```
DATABASE_URL=file:./dev.db        # local SQLite (default fallback)
DATABASE_URL=libsql://xxx.turso.io  # Turso remote (production)
TURSO_AUTH_TOKEN=eyJ...             # required when using Turso
AUTH_SECRET=<random-string>         # NextAuth JWT secret
BLOB_READ_WRITE_TOKEN=...           # Vercel Blob (production uploads)
```

`DATABASE_URL` has a hardcoded fallback to `file:<cwd>/dev.db` in `prisma.config.ts`, `src/lib/prisma.ts`, and `src/auth.ts`, so local dev works without `.env`.

## Architecture

### Database (Prisma 7 + libSQL)

**Prisma 7 is structurally different from earlier versions:**
- `datasource.url` is NOT in `schema.prisma` — it lives in `prisma.config.ts`
- The generated client outputs to `src/generated/prisma/` (not `node_modules`), which is gitignored and regenerated via `postinstall`
- Import from `@/generated/prisma/client`, not `@prisma/client`
- The adapter (`PrismaLibSql`) takes `{ url, authToken? }` directly — do **not** call `createClient()` manually

The SQLite file is `dev.db` in the **project root**. `scripts/migrate.ts` is a custom migration runner (Prisma CLI doesn't support `libsql://`) — it checks `_prisma_migrations` to skip already-applied migrations and uses `client.batch()`.

**JSON fields stored as TEXT** — parse/stringify at every API boundary, no ORM transform:
- `Trip.participants` — `"[]"` JSON array of name strings
- `Trip.tips` — `{"logistika":[],"pozor":[]}` or `null`
- `Trip.coverPhotoFocus` — `{"x":0.5,"y":0.7}` focal point for cover image cropping, or `null`
- `Stop.tags` — `[{"emoji":"🛵","label":"46 km na skútru"}]` array of `{ emoji, label }` objects, or `null`

**Stop description markdown** is a custom subset rendered identically in `StopForm.tsx` (admin preview) and `TripDays.tsx` (public): `**bold**`, `*italic*`, `==highlight==` (amber mark), `> blockquote` (blue left-border). Double newline = paragraph break.

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
    page.tsx         # Homepage: published trips grid + world map
    trips/[slug]/    # Trip detail: hero, map, stop timeline, tips
    participants/    # Participant index + per-person trip list
  (admin)/           # Auth required — layout has sidebar
    error.tsx        # Error boundary: catches server component crashes
    admin/
      trips/[id]/stops/  # Map-based stop editor (most complex page)
  api/               # REST endpoints; all protected except GET /api/trips
  auth/signin/       # Custom credentials login page
```

Route groups `(public)` and `(admin)` share the root `layout.tsx` but have separate nested layouts. There is **no** `src/app/page.tsx` — the homepage is served entirely by `(public)/page.tsx`.

### Map Components

All Leaflet/react-leaflet components must be `"use client"` and dynamically imported with `ssr: false`. Map containers require an explicit pixel height — percentage heights render invisible.

**Critical React 19 pattern** — `useMapEvents()` is broken in React 19 concurrent mode: its cleanup can fire after `MapContainer` has already removed the Leaflet map, throwing `"Cannot read properties of undefined (reading '_leaflet_events')"`. Always follow this pattern:

1. **Gate `MapContainer` behind `iconsReady` state** — initialise Leaflet icons in `useEffect`, set `iconsReady = true` only after both icon refs are populated. Return a placeholder `<div>` until then. This prevents Leaflet from accessing uninitialised icon state.

2. **Replace `useMapEvents` with `useMap()` + manual event binding:**
```typescript
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap()
  const cbRef = useRef(onMapClick)
  cbRef.current = onMapClick
  useEffect(() => {
    function handleClick(e: LeafletMouseEvent) { cbRef.current(e.latlng.lat, e.latlng.lng) }
    map.on("click", handleClick)
    return () => {
      try { map.off("click", handleClick) } catch { /* map already removed */ }
    }
  }, [map]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
```

3. **Always pass explicit `Icon` refs to `<Marker>`** — never `undefined`.

Leaflet icon defaults are fixed via `L.Icon.Default.mergeOptions` pointing to `/public/leaflet/`. The `require("leaflet")` call must be inside `useEffect` (not at module level).

### File Uploads

`POST /api/upload` accepts `multipart/form-data` with fields `file` (File) and `type` (`"covers"` | `"stops"`).

**Always compress client-side** before uploading — use `compressImage(file, type)` from `src/lib/compressImage.ts`. This converts to WebP ≤3.5 MB, staying under Vercel's 4.5 MB function payload limit. The route still validates MIME type and enforces a 5 MB hard limit.

Upload routing in `src/app/api/upload/route.ts`:
- `BLOB_READ_WRITE_TOKEN` set → Vercel Blob (`put()` receives a `Buffer`, not a `File`)
- `VERCEL=1` without token → 503 with actionable message
- Otherwise → local `public/uploads/{type}/` (dev only, Vercel FS is read-only)

Blob store must be created with **Public** access in Vercel dashboard — Private access returns 500.

### Admin Navigation

After a successful form save, navigate with `router.push(url)` only — **never** call `router.refresh()` immediately after. Combining both corrupts Next.js App Router's navigation state and causes "This page couldn't load" on the destination page.
