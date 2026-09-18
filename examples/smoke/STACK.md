# fenod-smoke — law reference app

Integration reference for [Fenod Stack Contract](../../docs/stack-contract.md), **experimental and not a production-safe starter**. It is the candidate base for the [maintained starter](../../plans/010-maintained-starter.md). The [September audit](../../plans/009-agent-first-audit.md) records configuration, auth, validation, dependency and portability gaps. Do not deploy the demo routes unchanged. See [README status table](./README.md#status-experimental-not-production-ready) for what is and is not verified.

UI policy: `@shadcn/lint` runs inside `pnpm lint` through Oxlint. `no-restyle` allows layout at call sites; variants belong in `src/components/ui`. `src/lint-policy.test.ts` checks both accepted and rejected usage.

| Law                      | This app                                                                                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node 24 + pnpm           | `package.json` engines + pnpm                                                                                                                                                     |
| TanStack Start + Workers | Vite CF plugin + `wrangler.jsonc`                                                                                                                                                 |
| One package day-one      | This directory only — no monorepo                                                                                                                                                 |
| Drizzle 0.4x + D1        | `src/db/*`, D1 binding `DB`                                                                                                                                                       |
| Better Auth              | `src/lib/auth.ts` — `better-auth/minimal`, Drizzle/D1, cookie cache, CF IP, D1 rate limits                                                                                        |
| Same-origin API          | `/api/auth/*` is a Start server route (`src/routes/api/auth/$.ts`). No CORS.                                                                                                      |
| Server functions first   | `src/server/items.ts` owns the item flow; input is parsed from `unknown` in `item-input.ts`. Add Hono + oRPC only for a real API boundary — see [recipes](../../docs/recipes.md). |
| Ownership                | Every read and write filters on the session `userId` from `src/lib/auth.ts`. A cross-user id matches nothing and returns `not_found`.                                             |
| Tailwind v4 + shadcn     | Radix `new-york` in `components.json`. Install official components/blocks with `pnpm dlx shadcn@latest add <item>`; do not silently switch to Base UI or recreate lookalikes.     |
| Wrangler deploy          | `pnpm deploy`                                                                                                                                                                     |
| Worker types             | `pnpm cf-types` (`wrangler types`)                                                                                                                                                |
| Environment and secrets  | `wrangler.jsonc` declares public `vars` and `secrets.required`. `src/env.ts` validates what Better Auth consumes; local dev needs only an untracked `.dev.vars`.                  |
| TypeScript 7 transition  | Target: replace `@typescript/native-preview` / `tsgo` with stable `typescript` / `tsc` after tooling validation                                                                   |
| Ship gate                | `pnpm check && pnpm test`                                                                                                                                                         |

## Local secrets

```bash
cp .dev.vars.example .dev.vars   # gitignored, holds BETTER_AUTH_SECRET only
# or: infisical run --env=dev -- pnpm dev
```

`BETTER_AUTH_URL` is a public `var` in `wrangler.jsonc`, not a secret. `APP_ENV` selects the validation rules.

## Remote deploy checklist

CI/human-owned operation only, after the audit blockers are resolved. Agents do not run these commands.

1. `pnpm dlx wrangler d1 create fenod-smoke` → set `database_id` in `wrangler.jsonc`
2. `pnpm db:remote`
3. Sync secrets from Infisical (or `wrangler secret put BETTER_AUTH_SECRET`)
4. Set `BETTER_AUTH_URL` to the public origin (not localhost)
5. `pnpm ship && pnpm deploy`

## Not in scope

- Alchemy, monorepo, Postgres, Polar, R2 uploads, Playwright, full offline
- Hono + oRPC in the seed: add them only when a real API boundary exists
- Organizations, roles, invitations and email verification
- Strict Oxlint on scaffold UI (law-owned paths are linted)
