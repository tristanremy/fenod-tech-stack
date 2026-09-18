# fenod-smoke — law reference app

Integration reference for [Fenod Stack Contract](../../docs/stack-contract.md), **experimental and not a production-safe starter**. It is the candidate base for the [maintained starter](../../plans/010-maintained-starter.md). The [September audit](../../plans/009-agent-first-audit.md) records remaining portability, deployment and operations gaps. See the [README status table](./README.md#status-experimental-not-production-ready) for verified scope.

UI policy: `@shadcn/lint` runs inside `pnpm lint` through Oxlint. `no-restyle` allows layout at call sites; variants belong in `src/components/ui`. `src/lint-policy.test.ts` checks accepted and rejected usage.

| Law                      | This app                                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node 24 + pnpm           | `package.json` engines + pnpm                                                                                                                                     |
| TanStack Start + Workers | Varlock-wrapped Cloudflare Vite plugin + `wrangler.jsonc`                                                                                                         |
| One package day-one      | This directory only — no monorepo                                                                                                                                 |
| Drizzle 0.4x + D1        | `src/db/*`, D1 binding `DB`                                                                                                                                       |
| Better Auth              | `src/lib/auth.ts` — `better-auth/minimal`, Drizzle/D1, cookie cache, CF IP, D1 rate limits                                                                        |
| Same-origin API          | `/api/auth/*` is a Start server route. No CORS.                                                                                                                   |
| Server functions first   | `src/server/items.ts` owns the item flow; `item-input.ts` parses `unknown`. Add Hono + oRPC only for a real API boundary.                                         |
| Ownership                | Every read/write filters on the authenticated session `userId`; cross-user ids return `not_found`.                                                                |
| Tailwind v4 + shadcn     | Radix `new-york` in `components.json`; install official items with `pnpm dlx shadcn@latest add <item>`.                                                           |
| Remote mutation          | Blocked by `scripts/local-only.mjs`; requires the S4/S5 approvals in plan 010.                                                                                    |
| Worker types             | `pnpm cf-types` uses `varlock-wrangler types`; run before typecheck after schema/binding changes.                                                                 |
| Configuration pilot      | `.env.schema` is the single app-config schema. It permits only synthetic `test`/loopback values, disables Varlock disk cache, and keeps `DOPPLER_TOKEN` internal. |
| TypeScript 7 transition  | Target stable TypeScript 7 after tooling validation; current gate is pinned `tsgo`.                                                                               |
| Ship gate                | `pnpm check && pnpm test`; build and type generation remain explicit higher-risk/preparation steps.                                                               |

## S2 local configuration override

This example deliberately overrides the repository's Infisical default **only for a fixture-only Varlock experiment**:

```bash
pnpm config:check
pnpm cf-types
pnpm db:local
pnpm dev
```

No local secret file or account is needed. The Doppler plugin is absent. Active `.env*` / `.dev.vars*` override files make Vite stop without deleting or printing them. Agent diagnostics use `--agent`; raw `json-full` is forbidden when values are real.

This is not evidence for Doppler access, production secret resolution, target inventory or Cloudflare deployment. The root contract remains authoritative outside this bounded experiment.

## Not in scope

- Production/development vault values, remote D1, Worker deployment or destructive secret replacement
- Alchemy, monorepo, Postgres, Polar, R2 uploads, Playwright, full offline
- Hono + oRPC without a real external API consumer
- Organizations, roles, invitations and email verification
- Strict Oxlint on scaffold UI (law-owned paths are linted)
