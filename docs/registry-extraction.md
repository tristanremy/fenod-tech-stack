# Fenod shadcn registry — later

Do not build a registry until a second Fenod app needs to install the same module twice.

Smoke already keeps extractable seams:

| Module | Files |
| --- | --- |
| better-auth-cloudflare | `examples/smoke/src/lib/auth.ts`, `auth-settings.ts`, auth tables in `src/db/schema.ts` |
| owned-crud-server-functions | `examples/smoke/src/server/items.ts`, `item-input.ts`, `src/queries/items.ts` |
| drizzle-d1 | `examples/smoke/src/db/*`, `drizzle.config.ts`, `wrangler.jsonc` D1 binding |
| wrangler-types | `pnpm cf-types` |

Hono + oRPC left the seed in the S1 batch: they belong to the optional API boundary, not the
minimum app. Re-add them per the [API-boundary recipe](recipes.md) instead of restoring the old
playground.

Still missing as code: Better Upload + R2, Polar, Playwright auth, observability package.

When extracting: one shadcn registry item per folder above, no extra abstraction layer inside the app first.
