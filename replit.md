# LUMINA

A premium dark social network — where moments become memories. Think of a private members' club for digital creators: dark, electric, and alive.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000/8080)
- `pnpm --filter @workspace/lumina run dev` — run the frontend (Vite, auto-port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild composite libs (run this after changing lib/db schema)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4, wouter routing, TanStack Query, sonner toasts
- API: Express 5 + Zod validation + JWT auth (jsonwebtoken + bcryptjs)
- DB: PostgreSQL + Drizzle ORM (9 tables)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Fonts: Syne (600,800), DM Sans (400,500), JetBrains Mono (400)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI 3.1 spec (source of truth for API contracts)
- `lib/api-zod/` — generated Zod schemas for all request/response bodies
- `lib/api-client-react/` — generated TanStack Query hooks; configure auth via `setAuthTokenGetter()`
- `lib/db/src/schema/` — Drizzle schema files (users, posts, comments, likes, follows, stories, story_views, notifications, saved_posts)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, posts, users, stories, notifications)
- `artifacts/api-server/src/lib/auth.ts` — JWT middleware (`requireAuth`, `optionalAuth`, `signToken`)
- `artifacts/api-server/src/lib/feed.ts` — complex feed query builder (raw SQL via drizzle sql``)
- `artifacts/api-server/src/lib/seed.ts` — seeds 5 users + 10 posts + reactions + stories on first boot
- `artifacts/lumina/src/pages/` — React pages (auth, feed, explore, notifications, profile, saved, post-detail, settings)
- `artifacts/lumina/src/lib/auth.ts` — `getToken/setToken/removeToken` using `lumina_token` localStorage key

## Architecture decisions

- **Contract-first API**: OpenAPI spec is the source of truth; Zod schemas and React Query hooks are generated from it. Never handwrite these.
- **JWT in localStorage**: Token stored as `lumina_token`. `setAuthTokenGetter` in main.tsx wires it into every API call automatically via the custom fetch layer.
- **Feed queries use raw SQL**: Complex multi-join queries (feed, explore, saved) use `db.execute(sql.raw(...))` for performance. Simple CRUD uses Drizzle ORM query builder.
- **Seed on startup**: `seedIfEmpty()` runs on every server boot but no-ops if users exist — safe to run repeatedly.
- **After changing lib/db schema**: run `pnpm run typecheck:libs` to rebuild composite lib declarations before typechecking the server.

## Product

- **Auth**: register/login with username, email, password. JWT-based, 7-day expiry.
- **Feed**: posts from followed users + own posts, infinite scroll, loading skeletons.
- **Moments**: dual-image posts with gradient border (electric violet → neon pink).
- **Stories**: 24-hour expiry, grouped by user, full-screen viewer with progress bars.
- **Reactions**: 6-emoji picker (❤️ 🔥 😂 😮 😢 👏) on long-press/right-click.
- **Explore**: masonry trending posts, live user search, trending hashtags with tag filtering.
- **Notifications**: like/comment/follow/mention, unread badge, mark-all-read.
- **Profiles**: cover + avatar, stats, follow/unfollow, post grid, edit profile modal.
- **Spotlight mode**: double-click any image for full-screen lightbox.

## Seed users (all password: `lumina123`)

- `luna` — photographer, verified ✦
- `nova` — designer, verified ✦  
- `kai` — developer
- `zara` — artist, verified ✦
- `echo` — music producer

## Gotchas

- After schema changes, always `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck`.
- OpenAPI endpoint collision: if an endpoint has BOTH path params AND query params, Orval generates a `Params` type collision. Fix by removing query params from that endpoint (see `listUserPosts` pattern).
- `onConflictDoNothing()` is a Drizzle method available on insert — used for upsert-like operations (follows, likes, story views, notifications).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
