# fenod-smoke — law reference app

Implements [Fenod Stack Contract](https://stack.fenod.fr/stack-contract/).

| Law | This app |
| --- | --- |
| Node 24 + pnpm | `package.json` engines + pnpm |
| TanStack Start + Workers | Vite CF plugin + `wrangler.jsonc` |
| One package day-one | This directory only — no monorepo |
| Drizzle 0.4x + D1 | `src/db/*`, D1 binding `DB` |
| Better Auth | `src/lib/auth.ts` + Drizzle/D1 adapter + auth tables in `src/db/schema.ts` |
| Tailwind v4 + shadcn | scaffold defaults |
| Hono/ORPC when needed | oRPC demo routes present |
| Wrangler deploy | `pnpm deploy` |
| Infisical | use `infisical run -- pnpm dev` in real projects; local may use `.dev.vars` untracked |
| Oxlint + Oxfmt via Ultracite | `pnpm lint` / `pnpm format` |
| Ship gate | `pnpm lint && pnpm typecheck && pnpm test` |

## Local secrets

```bash
cp .dev.vars.example .dev.vars   # gitignored
# or: infisical run --env=dev -- pnpm dev
```

## Remote deploy checklist

1. `pnpm dlx wrangler d1 create fenod-smoke` → set `database_id` in `wrangler.jsonc`
2. `pnpm db:remote`
3. Sync secrets from Infisical (or `wrangler secret put BETTER_AUTH_SECRET`)
4. `pnpm ship && pnpm deploy`

## Not in scope

- Alchemy, monorepo, Postgres, full offline
- Strict Ultracite on scaffold demo UI (demos ignored; law-owned paths linted)
