# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: This is Next.js 16

Next.js 16 has breaking changes from earlier versions. Read `node_modules/next/dist/docs/` before writing code. Key difference: `src/middleware.ts` is deprecated in favour of `src/proxy.ts`, but **use `middleware.ts` on Vercel** — Vercel does not yet support the `proxy.ts` convention.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # migrate + seed + next build
npm run lint         # ESLint
npm run db:seed      # Create admin user (admin/admin) if missing
npm test             # Run Vitest test suite (once)
npm run test:watch   # Run Vitest in watch mode
npx vitest run src/app/api/upload/__tests__/route.test.ts  # Run a single test file
npx prisma generate                        # Regenerate client after schema change
npx prisma studio                          # Browse the database
```

**Migrations** — do NOT use `prisma migrate dev`. Instead, write SQL manually in `prisma/migrations/<timestamp_name>/migration.sql` and update `schema.prisma`. The custom runner `scripts/migrate.ts` applies unapplied migrations on every build.

## Environment Variables

```
DATABASE_URL=file:./dev.db        # local SQLite (default fallback)
DATABASE_URL=libsql://xxx.turso.io  # Turso remote (production)
TURSO_AUTH_TOKEN=eyJ...             # required when using Turso
AUTH_SECRET=<random-string>         # NextAuth JWT secret
BLOB_READ_WRITE_TOKEN=...           # Vercel Blob (production uploads)
YOUTUBE_API_KEY=AIza...             # YouTube Data API v3 key (for match video search)
```

`DATABASE_URL` has a hardcoded fallback to `file:<cwd>/dev.db` in `prisma.config.ts`, `src/lib/prisma.ts`, and `src/auth.ts`, so local dev works without `.env`.

## Architecture

### Database (Prisma 7 + libSQL)

**Prisma 7 is structurally different from earlier versions:**
- `datasource.url` is NOT in `schema.prisma` — it lives in `prisma.config.ts`
- The generated client outputs to `src/generated/prisma/` (not `node_modules`), which is gitignored and regenerated via `postinstall`
- Import from `@/generated/prisma/client`, not `@prisma/client`
- The adapter (`PrismaLibSql`) takes `{ url, authToken? }` directly — do **not** call `createClient()` manually

The SQLite file is `dev.db` in the **project root**.

**JSON fields stored as TEXT** — parse/stringify at every API boundary, no ORM transform:
- `Trip.participants` — `"[]"` JSON array of name strings
- `Trip.tips` — `{"logistika":[],"pozor":[]}` or `null`
- `Trip.coverPhotoFocus` — `{"x":0.5,"y":0.7}` focal point for cover image cropping, or `null`
- `Stop.tags` — `[{"emoji":"🛵","label":"46 km na skútru"}]` array of `{ emoji, label }` objects, or `null`
- `Match.attendees` — `"[]"` JSON array of name strings (same pattern as Trip.participants)

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
    spurs/           # Tottenham match history (public)
  (admin)/           # Auth required — layout has sidebar
    error.tsx        # Error boundary: catches server component crashes
    admin/
      trips/[id]/stops/  # Map-based stop editor (most complex page)
      trips/[id]/photos/ # TripPhoto bulk manager (drone + stop assignment)
      matches/       # Match list with inline editing + new/edit forms
      seasons/       # Season registry (číselník)
  api/               # REST endpoints; all protected except GET /api/trips
  auth/signin/       # Custom credentials login page
```

Route groups `(public)` and `(admin)` share the root `layout.tsx` but have separate nested layouts. There is **no** `src/app/page.tsx` — the homepage is served entirely by `(public)/page.tsx`.

The admin sidebar (`AdminSidebar.tsx`) uses a multi-level nav with collapsible groups. **Spurs** is a parent group with **Zápasy** and **Sezóny** as children. Groups auto-expand when the active route is under them.

### Matches (Spurs section)

Three models: `Season` (číselník), `Match`, `MatchPhoto`. Key non-obvious fields:

- `Match.homeAway` — `"home"` | `"away"`. When home, venue is auto-filled to `"Tottenham Hotspur Stadium"`.
- `Match.outcome` — `null` (90 min) | `"aet"` (after extra time) | `"pen"` (after penalties). Shown as AET/PEN badge on public page.
- `Match.attendees` — JSON TEXT, same pattern as `Trip.participants`.
- `Match.seasonId` — nullable FK to `Season`.

**Competition values** (exhaustive list): `"Premier League"`, `"Champions League"`, `"Europa League"`, `"UEFA Conference League"`, `"FA Cup"`, `"EFL Cup"`, `"Superpohár"`, `"Přátelský zápas"`. Keep in sync across `MatchForm.tsx`, `MatchInlineRow.tsx`, `MatchList.tsx` (color map), and the AI prompt in `MatchImportExportButton.tsx`.

**Match JSON Import/Export** mirrors the trip stops pattern — ID-based diff with preview:
- `GET /api/matches/export` — includes `id`, `seasonId`, `outcome`, `photos` per match
- `POST /api/matches/import` — accepts `{ preview: boolean, matches: [...] }` or plain array; computes toUpdate/toCreate/toDelete based on `id` presence; `preview: true` returns stats without writing
- `MatchImportExportButton.tsx` runs the same two-step (input → preview → confirm) UI as `TripJsonUpdateButton.tsx`

**Attendee autocomplete** (`AttendeeInput.tsx`) — `GET /api/attendees` returns deduplicated names from all existing matches + trips. Uses `onMouseDown` not `onClick` in the dropdown to prevent blur-before-click race condition.

**YouTube video search** — `GET /api/youtube/search?q=` proxies YouTube Data API v3. Requires `YOUTUBE_API_KEY`. Returns `{ videos: [{ videoId, title, thumbnail, channelTitle, publishedAt }] }`. Used by `YouTubeSearch.tsx` component in `MatchForm`.

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

`POST /api/upload` accepts `multipart/form-data` with fields `file` (File) and `type` (`"covers"` | `"stops"` | `"matches"` | `"trips"`).

**Always compress client-side** before uploading — use `compressImage(file, type)` from `src/lib/compressImage.ts`. This converts to WebP ≤3.5 MB, staying under Vercel's 4.5 MB function payload limit. The route still validates MIME type and enforces a 5 MB hard limit.

Upload routing in `src/app/api/upload/route.ts`:
- `BLOB_READ_WRITE_TOKEN` set → Vercel Blob (`put()` receives a `Buffer`, not a `File`)
- `VERCEL=1` without token → 503 with actionable message
- Otherwise → local `public/uploads/{type}/` (dev only, Vercel FS is read-only)

Blob store must be created with **Public** access in Vercel dashboard — Private access returns 500.

### Trip JSON Import/Export

Three API endpoints handle bulk trip data transfer:
- `GET /api/trips/[id]/export` — downloads `<slug>.json` with all trip fields, stops, and photos; omits `id`/`slug`/`published`
- `POST /api/trips/import` — creates a new **draft** trip from JSON including stops and photos; auto-generates slug from title
- `POST /api/trips/[id]/update-from-json` — updates trip metadata and syncs stops via ID-based diff: updates stops whose `id` matches, creates stops with no/unknown `id`, deletes stops not present in JSON. Supports `preview: true` to return diff stats without writing. **No undo.**

`TripImportButton` (trips list) has a copyable AI prompt template. `TripJsonUpdateButton` (trip detail) has a "Načíst aktuální" button and two-step input → preview → confirm flow.

### Stop Editor Panel

`/admin/trips/[id]/stops` renders a two-panel layout: Leaflet map (`flex-1` left) and a `w-[420px]` right panel bounded by `h-[calc(100vh-160px)]`. The panel is either the **stop list** or the **stop form** — never both simultaneously. The switch is driven by `pendingLatLng || selectedStop` state in `StopEditor.tsx`.

**Scroll pattern** — the right panel uses `flex flex-col min-h-0`. The stop list card uses `flex-1 flex flex-col min-h-0 overflow-hidden` with a `flex-shrink-0` header and `flex-1 overflow-y-auto` list. The stop form is wrapped in `flex-1 overflow-y-auto`. The `min-h-0` on flex children is required in column-flex contexts to allow scroll to activate — without it `min-height: auto` prevents shrinking.

`StopForm` receives `stopNumber` and `latLng` props (for GPS display). Photo upload uses `multiple` and processes files **sequentially** (one compress+upload at a time) to avoid saturating the upload endpoint.

### Admin Navigation

After a successful form save, navigate with `router.push(url)` only — **never** call `router.refresh()` immediately after. Combining both corrupts Next.js App Router's navigation state and causes "This page couldn't load" on the destination page.

### TripPhoto vs Photo (two separate photo models)

There are two distinct photo models — do not confuse them:

- **`Photo`** — stop-level photos, FK to `Stop`. Managed inside `StopForm.tsx` (the stop editor). Deleted via `DELETE /api/photos/[photoId]`.
- **`TripPhoto`** — trip-level photos, FK to `Trip` with optional `stopId`. Managed via `TripPhotoManager.tsx` at `/admin/trips/[id]/photos`.

`TripPhoto` has two special flags:
- `isDrone: boolean` — drone/aerial photos; displayed in the `TripDronePhotos` section on public trip detail.
- `stopId: string | null` — optional stop assignment; when set, the photo appears inline in the stop timeline on public trip detail.

`TripPhotoManager` sorts photos into three columns: drone, unassigned, and per-stop buckets.

### Shared Types and Date Serialization

All shared TypeScript interfaces live in `src/types/index.ts`. Import from `@/types`, not from the Prisma-generated client.

All Prisma `DateTime` fields are serialized to ISO strings (`.toISOString()`) before being passed from server components to client components. The interfaces in `src/types/index.ts` reflect this — every date field is typed as `string`.

### Public Page Caching (ISR)

Public pages use `export const revalidate = 60` for 1-minute ISR. The trip detail page additionally uses `generateStaticParams` to pre-render published trip slugs at build time.

### Kartičky (Card Collection)

Three models: `CardSeries`, `Card`, `CardVariant`. Key design decisions:

- `CardSeries.displayMode` — `"missing_only"` | `"full_collection"`. Controls the public checklist view.
- `CardSeries.totalCardsCount` — user-set total (e.g. 500 base cards). Used as denominator for progress bar percentage: `ownedVariants / totalCardsCount`.
- `Card.number` — card number/code (string, e.g. `"G-12"`). Unique per series: `@@unique([seriesId, number])`.
- `CardVariant` — represents one version of a card (Base, Red /99, Gold /25). `limitNumber` is nullable; `isOwned` is toggled via `PUT /api/card-variants/[id]`.

**AI Import flow** — `POST /api/card-series/[id]/import` accepts a JSON array of `{ number, name, variants: [{ variant_name, limit_number }] }`. If a card with the same number already exists, only new variants are added (no duplicates). The admin UI shows a copyable AI prompt; user processes raw checklist text in external AI, pastes resulting JSON, submits.

**Public routes**: `/kartickar` (series list with progress bars), `/kartickar/[slug]` (detail with checklist).

**Admin routes**: `/admin/kartickar` (list + delete), `/admin/kartickar/new` (create), `/admin/kartickar/[id]` (edit + import + toggle is_owned).

**Progress calculation**: `Math.min(100, Math.round(ownedVariants / totalCardsCount * 100))`. Color thresholds: green at 100%, blue above 50%, amber below.

### Trip Fields

`Trip.tripType` valid values: `"roadtrip"`, `"trekking"`, `"město"`, `"dobrodružství"`. Keep in sync across `TripForm.tsx`, `TripDays.tsx`, and `(public)/trips/[slug]/page.tsx`.
