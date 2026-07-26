---
name: fenod-stack
description: Fenod's opinionated stack for building web apps, sites, and APIs. Use this skill whenever starting a new Fenod project, scaffolding an app, choosing between frameworks (TanStack Start, Astro, Hono), structuring a monorepo, writing API routers or services, configuring TypeScript, or picking UI libraries — even if the user just says "new project", "new app", "new client site", or asks how something should be organized in a Fenod codebase.
---

# Fenod Stack

**Stack Contract is law.** This skill is the short operating copy. If anything here drifts, follow `src/content/docs/stack-contract.md` (or https://stack.fenod.fr/stack-contract/).

## One-liner

> Node 24 + pnpm. TanStack Start + Workers. Drizzle/D1 + Better Auth. Tailwind v4 + shadcn. Wrangler. Oxlint + Oxfmt via Ultracite. Infisical + Worker secrets. Hono/ORPC only when an API boundary needs it. Smallest gate. No secrets in git, no prod authority, no stack thrash.

## Decision matrix

| Need | Stack | Deploy |
|------|-------|--------|
| Full-stack app | TanStack Start (+ Hono/ORPC when API boundary needs it) + Drizzle + D1 + Better Auth | CF Workers |
| Content + SEO | Astro | CF Workers static assets |
| SPA | TanStack Start | CF Workers |
| API only | Hono + ORPC + Drizzle + D1 | CF Workers |
| Docs | Starlight | CF Workers static assets |
| Second deployable / shared libs | Add monorepo (+ Turborepo if needed) | — |

Pages is legacy-only for already-connected static/docs sites. New work targets Workers.

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

- **Node 24** + **pnpm**. No npm/yarn. Bun/Deno not required baselines.
- **Vite 8 + Rolldown** for new apps; `rolldown-vite` only as Vite 7 bridge.
- **Drizzle 0.4x** until v1 stable + migration plan.
- **Oxlint + Oxfmt** via Ultracite. No ESLint/Prettier by default.
- **tsgo** for typecheck; keep `typescript` installed.
- Validate env with **Zod**. Secrets via **Infisical**. Never commit real `.env` / `.dev.vars`.
- UI: **Tailwind v4 + shadcn/ui**.
- AI: **TanStack AI + AI Gateway**. Uploads: R2 (+ D1 metadata).
- Deploy: **Wrangler**. Alchemy v2 only on contract triggers.

## Grow on triggers only

| Trigger | Add |
|---------|-----|
| API boundary / non-UI clients | Hono + ORPC |
| Thick feature API | slices: `router.ts` thin, `service.ts` + Drizzle direct |
| Second deployable / shared package | monorepo |
| 4+ CF resources shared lifecycle, 3+ stages, multi-account | Alchemy v2 |
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
- Data fetching: prefer existing repo patterns; see `tanstack-data-fetching.md` only if needed.
- React: `react-best-practices.md` for a11y/security basics.
- Long guides are depth, not law.

## Deep references

Resolve `src/content/docs/<slug>.md` via this repo checkout or `https://raw.githubusercontent.com/tristanremy/fenod-tech-stack/main/src/content/docs/<slug>.md`.

| Need | Read |
|------|------|
| Law | `stack-contract.md` |
| Agent entry | `ai-index.md` |
| Deploy | `deployment.md` |
| Tooling | `tooling.md` |
| Gotchas | `gotchas.md` |
| Recipes | `recipes.md` |
