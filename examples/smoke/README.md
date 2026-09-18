# fenod-smoke

One package. TanStack Start on Cloudflare Workers. Drizzle + D1. Better Auth. Tailwind + shadcn. Oxlint + Oxfmt. Wrangler.

## Status: experimental, not production-ready

This is the executable reference for the [Fenod Stack Contract](../../docs/stack-contract.md), and the
candidate base for the [maintained starter](../../plans/010-maintained-starter.md). Copy it for
experiments. **Do not copy it into production unchanged** — the
[September audit](../../plans/009-agent-first-audit.md) lists the open gaps.

| Verified                                                           | Not verified — do not assume                         |
| ------------------------------------------------------------------ | ---------------------------------------------------- |
| `pnpm install --frozen-lockfile` on Node 24 / pnpm                 | Sign-up, CRUD, sign-out and two-user isolation in CI |
| `pnpm ship` (format, lint, typecheck, 19 tests)                    | Deployed Worker with real secrets and bindings       |
| `pnpm build` (client + Worker SSR bundles)                         | Remote D1 migration or deployment                    |
| `pnpm db:local` and `pnpm db:generate` on local D1                 | Account recovery, email verification, abuse controls |
| `pnpm audit --audit-level high` (no high/critical)                 | Portable export without the parent handbook          |
| Manual browser run: sign-up → CRUD → sign-out → two users isolated | Observability, backups, rate-limit tuning            |

## What the reference demonstrates

One domain feature, end to end, without framework ceremony:

- **Sign-up / sign-in** through Better Auth on `/api/auth/*`, a Start server route.
- **Server functions**, not API handlers: `src/server/items.ts` reads and writes D1.
- **Runtime validation**: `src/server/item-input.ts` parses every input from `unknown` with Zod, so
  a TypeScript annotation is never the only guard.
- **Owner scoping**: every query filters on the session `userId`. Another user's id matches nothing
  and returns `not_found` — never another user's row.
- **Expected failures as data**: `ItemOutcome` distinguishes `unauthenticated` and `not_found` from
  real faults, so the UI can say something actionable.
- **One client cache owner**: TanStack Query holds the list; mutations invalidate it and sign-out
  clears it.

Hono + oRPC are deliberately **not** in this seed. Add them only when a real API boundary or non-UI
client exists ([recipe](../../docs/recipes.md)).

## Setup

```bash
cd examples/smoke
pnpm install
cp .dev.vars.example .dev.vars   # gitignored; holds BETTER_AUTH_SECRET only
pnpm db:local                    # apply D1 migrations to local wrangler state
pnpm dev
```

`APP_ENV` and `BETTER_AUTH_URL` are public `vars` in `wrangler.jsonc`. `BETTER_AUTH_SECRET` is
declared in `secrets.required`, which drives `wrangler types` and missing-secret warnings in
`wrangler dev`. `src/env.ts` validates the result and never echoes a value in an error.

Secrets for real projects currently follow the contract:

```bash
infisical run --env=dev -- pnpm dev
infisical scan git-changes --staged
```

Infisical is the source of truth today. Doppler + Varlock is a **candidate replacement under
evaluation**; the current contract still wins until that plan is adopted.

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

After changing routes, run `pnpm generate-routes` before typechecking: the route tree is generated and
committed.

## Deploy

Blocked by the audit gaps above. The sequence is:

1. `pnpm dlx wrangler d1 create fenod-smoke` → put `database_id` in `wrangler.jsonc`
2. `pnpm db:remote` (migrations)
3. Put secrets: `infisical run --env=prod -- pnpm exec wrangler secret put BETTER_AUTH_SECRET` (or sync from Infisical)
4. Set `BETTER_AUTH_URL` to the public https origin and `APP_ENV` to `production`
5. `pnpm deploy`

## Law map

See [STACK.md](./STACK.md).
