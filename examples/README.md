# Examples

| Path | Role |
| --- | --- |
| [`smoke/`](./smoke/) | **Experimental exportable app** — one-package TanStack Start + Workers/D1 + Better Auth + fixture-only Varlock + pinned CI/browser checks |
| [`astro/`](./astro/) | **Static content reference** — standalone Astro, safe Head/JSON-LD, native images and generated-HTML tests |

For static content/marketing, read the [Astro recipe](../docs/astro.md) instead of adding an app backend.

## Export the application starter

Never copy the working directory. Select an immutable commit:

```bash
revision=$(git rev-parse HEAD)
node scripts/export-starter.mjs "$revision" ../my-app
cd ../my-app
pnpm install --frozen-lockfile
pnpm cf-types
pnpm ship
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

The export contains only the committed `examples/smoke` tree plus `starter-provenance.json`; it refuses overwrite, symlinks and secret/cache paths. Local fixture mode needs no vault or Cloudflare account. Remote migration and deployment scripts deliberately fail. Read the exported `AGENTS.md`, `STACK.md` and `README.md` before changing it.

Hono + oRPC remain optional until a real API consumer needs them. Production readiness still requires the separately approved vault/deployment gates in [plan 010](../plans/010-maintained-starter.md).
