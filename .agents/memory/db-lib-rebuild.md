---
name: DB lib rebuild after schema changes
description: Must run typecheck:libs after modifying lib/db schema or table exports won't be visible to consumers
---

`lib/db` is a composite TypeScript lib that emits `.d.ts` declaration files. After adding or modifying schema files in `lib/db/src/schema/`, the declarations must be rebuilt before dependent packages can see the exports.

**Rule:** Always run `pnpm run typecheck:libs` after any schema change, before running `pnpm --filter @workspace/api-server run typecheck`.

**Why:** TypeScript project references use the emitted `.d.ts` files, not the source. Stale declarations cause "Module has no exported member" errors even though the source is correct.

**How to apply:** Any time you edit `lib/db/src/schema/*.ts` or `lib/db/src/index.ts`, run `pnpm run typecheck:libs` as the next step.
