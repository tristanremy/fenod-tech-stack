# Fenod — agent entry

**Law:** `docs/stack-contract.md`. If anything else disagrees, the contract wins unless the project `STACK.md` / this file overrides a line.

**Proof:** `examples/smoke` (one-package TanStack Start + Workers + D1). Copy it. Do not invent a stack.

## Load

1. This file
2. `docs/stack-contract.md`
3. `docs/agent-operating-contract.md`
4. `docs/gotchas.md`
5. `docs/recipes.md`
6. `docs/security-model.md` when touching auth, secrets, Cloudflare, or email

Do not load old Starlight pages, French translations, or `code-patterns`.

## Enforce

- Node 24 + **pnpm** (not npm/yarn; Nub is not the lockfile)
- TanStack Start on **Cloudflare Workers**. Astro only for marketing/content sites.
- Drizzle **0.4x** + **D1**. Better Auth. Tailwind v4 + shadcn.
- Start server functions first. Hono + oRPC only when an API boundary needs it.
- Oxlint + Oxfmt + tsgo. Ship gate: `pnpm lint && pnpm typecheck && pnpm test`
- Infisical + Worker secrets. Never commit `.env` / `.dev.vars` with real values.
- Agents **push Git**. They do not `wrangler deploy` / `alchemy deploy` to staging/prod.
- Mutation → `invalidateQueries`. No Convex. No live DO without a written multi-user trigger.
- `wrangler types`. Dates `>= 2026-08-04` already include `nodejs_compat`. Observability on every Worker.

## Do not

npm/yarn, Nub as PM, Bun/Deno as baseline, Prisma, Postgres (until trigger), Express, tRPC, Redis, ESLint/Prettier/Biome/Ultracite, Drizzle v1 RC, new Pages projects, day-one Alchemy, day-one monorepo.

## Done

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Report: files changed, verification run, warnings, not done, whether prod action is still required.
