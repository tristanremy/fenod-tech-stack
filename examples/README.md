# Examples

| Path | Role |
| --- | --- |
| [`smoke/`](./smoke/) | **Experimental law reference app** — one-package TanStack Start + Workers + D1 + Better Auth + fixture-only Varlock + Wrangler + Oxlint/Oxfmt |
| [`astro/`](./astro/) | **Static content reference** — standalone Astro, safe Head/JSON-LD, native images and generated-HTML tests |

For static content/marketing, read the [Astro recipe](../docs/astro.md) instead of adding an app backend.

## Try smoke locally

```bash
cd examples/smoke
pnpm install --frozen-lockfile
pnpm config:check
pnpm cf-types
pnpm db:local
pnpm ship
pnpm dev
```

No vault or Cloudflare account is needed. The committed `.env.schema` permits only synthetic local values. Remote migration and deployment scripts deliberately fail.

Do not copy this working tree into a product yet. S3 in [plan 010](../plans/010-maintained-starter.md) will add a tracked-file export from an immutable revision and verify it outside this handbook. Hono + oRPC remain optional until a real API consumer needs them.
