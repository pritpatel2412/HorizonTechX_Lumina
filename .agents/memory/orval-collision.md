---
name: Orval TS2308 Params collision
description: How to fix Orval-generated TypeScript collision when endpoint has both path params and query params
---

When an OpenAPI endpoint has BOTH path parameters (e.g. `/{username}`) AND query parameters, Orval generates a `Params` type in both `api.ts` and the `types/` barrel, causing TS2308 "re-exported binding not found" errors.

**Fix:** Remove the query parameters from that endpoint's OpenAPI spec. If you need pagination on a user-specific endpoint, create a separate non-parameterized endpoint or accept the limitation.

**Example applied:** `GET /users/{username}/posts` — removed offset/limit query params; client just fetches all posts for a user.

**Why:** Orval's codegen flattens path + query params into a single `Params` type per endpoint. When both exist, it emits the type twice under the same name, which TypeScript rejects.
