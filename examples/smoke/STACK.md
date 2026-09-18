# fenod-smoke — law reference app

Integration reference for [Fenod Stack Contract](../../docs/stack-contract.md), **experimental and not a production-safe starter**. It is the candidate base for the [maintained starter](../../plans/010-maintained-starter.md). The [September audit](../../plans/009-agent-first-audit.md) records configuration, auth, validation, dependency and portability gaps. Do not deploy the demo routes unchanged. See [README status table](./README.md#status-experimental-not-production-ready) for what is and is not verified.

UI policy: `@shadcn/lint` runs inside `pnpm lint` through Oxlint. `no-restyle` allows layout at call sites; variants belong in `src/components/ui`. `src/lint-policy.test.ts` checks both accepted and rejected usage.

| Law                      | This app                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node 24 + pnpm           | `package.json` engines + pnpm                                                                                                                                                 |
| TanStack Start + Workers | Vite CF plugin + `wrangler.jsonc`                                                                                                                                             |
| One package day-one      | This directory only — no monorepo                                                                                                                                             |
| Drizzle 0.4x + D1        | `src/db/*`, D1 binding `DB`                                                                                                                                                   |
| Better Auth              | `src/lib/auth.ts` — `better-auth/minimal`, Drizzle/D1, cookie cache, CF IP, D1 rate limits                                                                                    |
| Same-origin API          | `/api/auth/*` and `/api/rpc/*` on one origin. No CORS.                                                                                                                        |
| Hono + oRPC              | `src/server/app.ts` mounts Better Auth and oRPC. Session resolved once per `/api/rpc` request.                                                                                |
| Tailwind v4 + shadcn     | Radix `new-york` in `components.json`. Install official components/blocks with `pnpm dlx shadcn@latest add <item>`; do not silently switch to Base UI or recreate lookalikes. |
| Wrangler deploy          | `pnpm deploy`                                                                                                                                                                 |
| Worker types             | `pnpm cf-types` (`wrangler types`)                                                                                                                                            |
| Environment and secrets  | Infisical is the source of truth; use `infisical run -- pnpm dev` or untracked `.dev.vars`; validate runtime config with Zod 4.5.x                                            |
| TypeScript 7 transition  | Target: replace `@typescript/native-preview` / `tsgo` with stable `typescript` / `tsc` after tooling validation                                                               |
| Ship gate                | `pnpm check && pnpm test`                                                                                                                                                     |

## Local secrets

```bash
cp .dev.vars.example .dev.vars   # gitignored
# or: infisical run --env=dev -- pnpm dev
```

## Remote deploy checklist

CI/human-owned operation only, after the audit blockers are resolved. Agents do not run these commands.

1. `pnpm dlx wrangler d1 create fenod-smoke` → set `database_id` in `wrangler.jsonc`
2. `pnpm db:remote`
3. Sync secrets from Infisical (or `wrangler secret put BETTER_AUTH_SECRET`)
4. Set `BETTER_AUTH_URL` to the public origin (not localhost)
5. `pnpm ship && pnpm deploy`

## Not in scope

- Alchemy, monorepo, Postgres, Polar, R2 uploads, Playwright, full offline
- Strict Oxlint on scaffold demo UI (demos ignored; law-owned paths linted)
