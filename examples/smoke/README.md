# fenod-smoke

One package. TanStack Start on Cloudflare Workers. Drizzle + D1. Better Auth. Tailwind + shadcn. Oxlint + Oxfmt. Varlock + Wrangler.

## Status: experimental, not production-ready

This is the executable reference for the [Fenod Stack Contract](../../docs/stack-contract.md), and the candidate base for the [maintained starter](../../plans/010-maintained-starter.md). Use it for local experiments. **Do not deploy or copy it into production unchanged** — the [September audit](../../plans/009-agent-first-audit.md) lists the open gaps.

| Verified                                                      | Not verified — do not assume                            |
| ------------------------------------------------------------- | ------------------------------------------------------- |
| Frozen install on Node 24 / pnpm                              | Sign-up, CRUD, sign-out and two-user isolation in CI    |
| `pnpm ship` (config, format, lint, types, tests)              | Doppler account, plugin, token or outage behavior       |
| Credential-free client + Worker build                         | Deployed Worker with real secrets and bindings          |
| Local D1 migration/generation                                 | Remote D1 migration or deployment                       |
| Fixture-only Varlock → Miniflare bindings                     | Portable export without the parent handbook             |
| Manual browser sign-up → CRUD → sign-out → two users isolated | Recovery, email verification, observability and backups |

## What the reference demonstrates

One domain feature, end to end, without framework ceremony:

- **Sign-up / sign-in** through Better Auth on `/api/auth/*`, a Start server route.
- **Server functions**, not API handlers: `src/server/items.ts` reads and writes D1.
- **Runtime validation**: Varlock validates app configuration from `.env.schema`; Zod parses domain input from `unknown` in `src/server/item-input.ts`.
- **Owner scoping**: every query filters on the session `userId`. Another user's id matches nothing and returns `not_found` — never another user's row.
- **Expected failures as data**: `ItemOutcome` distinguishes `unauthenticated` and `not_found` from real faults.
- **One client cache owner**: TanStack Query holds the list; mutations invalidate it and sign-out clears it.

Hono + oRPC are deliberately **not** in this seed. Add them only when a real API boundary or non-UI client exists ([recipe](../../docs/recipes.md)).

## Local setup

```bash
cd examples/smoke
pnpm install --frozen-lockfile
pnpm config:check  # agent-safe output; sensitive fixture is redacted
pnpm cf-types      # rerun after .env.schema or Wrangler bindings change
pnpm db:local
pnpm dev
```

No vault account, Cloudflare credential, `.env` or `.dev.vars` is needed. `.env.schema` fixes this S2 pilot to `APP_ENV=test`, a loopback URL and a clearly synthetic auth secret. `@cache=disabled` prevents a Varlock disk cache. `DOPPLER_TOKEN` is optional/internal and is not injected. The Doppler plugin is not installed, so fixture mode makes no Doppler call.

`varlockCloudflareVitePlugin` replaces the plain Cloudflare Vite plugin and injects only validated values into local Worker bindings. `varlock-wrangler types` combines those declared values with native D1 bindings. Its temporary env-file path is normalized out of the generated header so repeated generation is stable. The app keeps no second Zod schema for the same configuration.

If this directory already contains `.env*` or `.dev.vars*` overrides, Vite fails closed and names the conflicting files. Move them to a secure location, compare their **names** with `.env.schema`, and migrate deliberately. The guard never deletes or prints their values.

`pnpm config:check` uses `varlock load --agent --format json-full`, which redacts sensitive values. Plain `json-full` exposes resolved values and is not an agent command.

The repository contract still uses Infisical for real projects. Doppler + Varlock remains a candidate replacement; this fixture-only pilot does not change the default or validate vault access.

## Ship gate

```bash
pnpm config:check
pnpm format:check
pnpm lint
pnpm cf-types
pnpm typecheck
pnpm test
pnpm build
```

`pnpm ship` runs the read-only checks and tests. Run `pnpm cf-types` first after configuration/binding changes; generation is explicit. After changing routes, run `pnpm generate-routes` and inspect the diff before typechecking (the pinned router CLI is currently nondeterministic; see plan AR15).

## Remote operations

Blocked. `pnpm db:remote` and `pnpm deploy` intentionally fail before Wrangler runs. S4 requires explicit authorization for a named Doppler pilot; S5 separately requires an approved disposable Cloudflare Worker/D1, budget, deployment and cleanup. See [plan 010](../../plans/010-maintained-starter.md).

## Law map

See [STACK.md](./STACK.md).
