# fenod-smoke

One package. TanStack Start on Cloudflare Workers. Drizzle + D1. Better Auth. Hono + oRPC. Oxlint + Oxfmt. Wrangler.

## Status: experimental, not production-ready

This is the executable reference for the [Fenod Stack Contract](../../docs/stack-contract.md), and the
candidate base for the [maintained starter](../../plans/010-maintained-starter.md). Copy it for
experiments. **Do not copy it into production unchanged** — the
[September audit](../../plans/009-agent-first-audit.md) lists open configuration, auth,
validation, portability and dependency gaps.

| Verified after a clean frozen install                 | Not verified — do not assume                    |
| ----------------------------------------------------- | ----------------------------------------------- |
| `pnpm install --frozen-lockfile` on Node 24 / pnpm 10 | Browser sign-in, session expiry, logout         |
| `pnpm ship` (format, lint, typecheck, 6 tests)        | Remote D1 migration or deployment               |
| `pnpm build` (client + Worker SSR bundles)            | Worker secret/config startup with real bindings |
| `pnpm db:local` and `pnpm db:generate` on local D1    | Owner-scoped authorization on the demo routes   |
| `pnpm audit --audit-level high` (no high/critical)    | Production origin, recovery, observability      |

## Setup

```bash
cd examples/smoke
pnpm install
pnpm db:local          # apply D1 migrations to local wrangler state
pnpm dev
```

Secrets for real projects currently follow the contract:

```bash
infisical run --env=dev -- pnpm dev
infisical scan git-changes --staged
```

Infisical is the source of truth today. Sync secrets to Workers, use `.dev.vars` only as an ignored
local fallback, and validate runtime config with Zod. Doppler + Varlock is a **candidate
replacement under evaluation**; the current contract still wins until that plan is adopted.

## Ship gate

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
```

Or `pnpm ship`. Higher risk:

```bash
pnpm build
```

## Deploy

Blocked by the audit gaps above. The sequence is:

1. `pnpm dlx wrangler d1 create fenod-smoke` → put `database_id` in `wrangler.jsonc`
2. `pnpm db:remote` (migrations)
3. Put secrets: `infisical run --env=prod -- pnpm exec wrangler secret put BETTER_AUTH_SECRET` (or sync from Infisical)
4. Set `BETTER_AUTH_URL` to the public origin
5. `pnpm deploy`

## Law map

See [STACK.md](./STACK.md).
