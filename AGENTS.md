# Fenod — agent entry

**Law:** `docs/stack-contract.md`. If anything else disagrees, the contract wins unless the project `STACK.md` / this file overrides a line.

**Reference:** `examples/smoke` (one-package TanStack Start + Workers + D1). It is **experimental**: server functions parse bounded input and scope every row to the signed-in user, but there is no CI browser test, no validated Worker secret/config startup on a deployed target and no portable export yet. Do not deploy it unchanged. See `plans/009-agent-first-audit.md` for the gaps and `plans/010-maintained-starter.md` for the path to a maintained starter.

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
- Drizzle **0.4x** + **D1**. Better Auth. Tailwind v4 + shadcn. When asked for a shadcn component or block, install the exact official item with `pnpm dlx shadcn@latest add <item>`; do not recreate a lookalike. Customize only after installation.
- Start server functions first. Hono + oRPC only when an API boundary needs it.
- Oxlint + Oxfmt + TypeScript 7 `tsc`. Add `@shadcn/lint` through Oxlint for Tailwind design systems; use the UI recipe's initial policy. Product ship gate: `pnpm lint && pnpm typecheck && pnpm test`
- Infisical + Worker secrets + Zod 4.5.x config validation. Scan staged changes; never commit `.env` / `.dev.vars` with real values.
- Agents **push Git**. They do not `wrangler deploy` / `alchemy deploy` to staging/prod.
- Mutation → `invalidateQueries`. No Convex. No live DO without a written multi-user trigger.
- `wrangler types`. Dates `>= 2026-08-04` already include `nodejs_compat`. Observability on every Worker.

## Do not

npm/yarn, Nub as PM, Bun/Deno as baseline, Prisma, Postgres (until trigger), Express, tRPC, Redis, ESLint/Prettier/Biome/Ultracite, Drizzle v1 RC, new Pages projects, day-one Alchemy, day-one monorepo.

## Done

For this handbook (from repo root):

```bash
pnpm check && pnpm test
pnpm --dir examples/smoke ship
pnpm --dir examples/astro ship
```

`pnpm check` is read-only. After editing context sources, run `pnpm llms:build` explicitly and review generated changes. Product repos retain `pnpm lint && pnpm typecheck && pnpm test` in their own directory.

Report: files changed, verification run, warnings, not done, whether prod action is still required.
