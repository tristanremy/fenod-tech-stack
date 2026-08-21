---
name: fenod-stack
description: Fenod's opinionated stack for building web apps, sites, and APIs. Use this skill whenever starting a new Fenod project, scaffolding an app, choosing between frameworks (TanStack Start, Astro, Hono), structuring a monorepo, writing API routers or services, configuring TypeScript, or picking UI libraries — even if the user just says "new project", "new app", "new client site", or asks how something should be organized in a Fenod codebase.
---

# Fenod Stack

**Stack Contract is law.** This skill is the short operating copy. If anything here drifts, follow `docs/stack-contract.md`.

## One-liner

> Node 24 + pnpm. TanStack Start + Workers. Drizzle/D1 + Better Auth. Tailwind v4 + shadcn. Wrangler. Oxlint + Oxfmt. Infisical + Worker secrets. Hono/ORPC only when an API boundary needs it. Smallest gate. No secrets in git, no prod authority, no stack thrash.

## Decision matrix

| Need | Stack | Deploy |
|------|-------|--------|
| Full-stack app | TanStack Start (+ Hono/ORPC when API boundary needs it) + Drizzle + D1 + Better Auth | CF Workers |
| Content + SEO | Astro | CF Workers static assets |
| SPA | TanStack Start | CF Workers |
| API only | Hono + ORPC + Drizzle + D1 | CF Workers |
| Docs | Starlight | CF Workers static assets |
| Second deployable / shared libs | Add monorepo (+ Turborepo if needed) | — |

Pages is not sunset, but frozen. New work targets Workers. One Worker → Git-connect or CI Wrangler. Two or more Workers that share bindings → Alchemy via GitHub Action. Agents push Git; they do not deploy.

## Scaffolding

```bash
pnpm dlx @tanstack/cli@latest create my-app \
  --package-manager pnpm \
  --deployment cloudflare \
  --add-ons oRPC,drizzle,better-auth,shadcn,tanstack-query \
  --yes --non-interactive --no-git --no-toolchain
```

**Day-one shape = one package.** Swap scaffold Postgres → **D1**. Reference implementation: `examples/smoke` (see `STACK.md`). Do not create `apps/web` + `apps/server` + four packages + Alchemy on day one.

## Non-negotiables

- **Node 24** + **pnpm**. No npm/yarn. Bun/Deno not required baselines. Nub is optional local (`nub run` / `nubx`), not the lockfile.
- **Vite 8 + Rolldown** for new apps; `rolldown-vite` only as Vite 7 bridge.
- **Drizzle 0.4x** until v1 stable + migration plan.
- **Oxlint + Oxfmt**. React plugin + `correctness`. No ESLint/Prettier/Biome/Ultracite. No hand-wired `oxc-transform-react`.
- **tsgo** for typecheck; keep `typescript` installed.
- Validate env with **Zod**. Secrets via **Infisical**. Never commit real `.env` / `.dev.vars`.
- UI: **Tailwind v4 + shadcn/ui**.
- AI: **TanStack AI + AI Gateway**. Bounded/authorized tools, budgets, traces, and evals. Uploads: R2 (+ D1 metadata).
- Deploy: **Workers**. Wrangler / Git-connect for one Worker. Alchemy via GitHub Action when 2+ Workers share bindings.

## Grow on triggers only

| Trigger | Add |
|---------|-----|
| API boundary / non-UI clients | Hono + ORPC |
| Thick feature API | slices: `router.ts` thin, `service.ts` + Drizzle direct |
| Second deployable / shared package | monorepo |
| 2+ Workers share D1/R2/KV/queues | Alchemy + smallest-unit Action |
| 4+ CF resources shared lifecycle, 3+ stages, multi-account | Alchemy |
| Reporting / Postgres mandate / D1 ceiling | Postgres (+ Hyperdrive on CF) |
| Real field offline | project design; Query persist first |

No hexagonal. No repository interfaces around Drizzle without pain.

## Feature slices (when API module exists)

```txt
{api}/routers/{feature}/
├── index.ts
├── router.ts
└── service.ts
```

## Agent rules

- Match repo patterns; minimal diffs.
- Do not swap stack pieces unless asked.
- Data fetching: prefer existing repo patterns; `invalidateQueries` default. `live-queries.md` only with a written multi-user trigger.
- React: `react-best-practices.md` for a11y/security basics.
- Long guides are depth, not law.

## Deep references

Resolve `docs/<slug>.md` in this repo.

| Need | Read |
|------|------|
| Law | `docs/stack-contract.md` |
| Agent entry | `AGENTS.md` |
| Gotchas | `docs/gotchas.md` |
| Recipes | `docs/recipes.md` |
| Security | `docs/security-model.md` |
| AI and coding agents | `docs/agent-factory.md` |
| Proof | `examples/smoke` |
