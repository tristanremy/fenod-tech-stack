# Fenod shadcn registry — later

Do not build a registry until a second Fenod app needs to install the same module twice.

Smoke already keeps extractable seams:

| Module | Files |
| --- | --- |
| better-auth-cloudflare | `examples/smoke/src/lib/auth.ts`, `auth-settings.ts`, auth tables in `src/db/schema.ts` |
| orpc-hono | `examples/smoke/src/server/app.ts`, `src/orpc/context.ts` |
| drizzle-d1 | `examples/smoke/src/db/*`, `drizzle.config.ts`, `wrangler.jsonc` D1 binding |
| wrangler-types | `pnpm cf-types` |

Still missing as code: Better Upload + R2, Polar, Playwright auth, observability package.

When extracting: one shadcn registry item per folder above, no extra abstraction layer inside the app first.
