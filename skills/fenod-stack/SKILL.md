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
| ------ | ------- | -------- |
| Full-stack app | TanStack Start (+ Hono/ORPC when API boundary needs it) + Drizzle + D1 + Better Auth | CF Workers |
| Developer-maintained content + SEO | Astro | CF Workers static assets |
| Direct client content editing | Astro + EmDash candidate; supported CMS database/auth adapters | CF Workers SSR + D1 + R2 |
| SPA | TanStack Start | CF Workers |
| API only | Hono + ORPC + Drizzle + D1 | CF Workers |
| Docs | Starlight | CF Workers static assets |
| Second deployable / shared libs | Add monorepo (+ Turborepo if needed) | — |

Pages is not sunset, but frozen. New work targets Workers. Git-connect or CI Wrangler is the default. Shared infrastructure/stages are reasons to evaluate Alchemy 2; adoption requires a written need and pinned pilot. Agents push Git; they do not deploy through Wrangler, `cf` or Alchemy.

For Astro / SEO / JSON-LD / responsive-image tasks, read `docs/astro.md`, then `examples/astro/README.md` and its package scripts. Use that standalone static reference, not the app scaffold below.

For client editing/CMS tasks, read `docs/astro-emdash.md`. Keep the supported EmDash schema/migrations and auth as a bounded exception to app Drizzle/Better Auth defaults. Prove draft/publish permissions and full recovery before client production; the handbook has no validated CMS reference yet.

## Scaffolding

New client app: export the starter, then follow `docs/new-project.md` (agent vs human steps, GitHub and Cloudflare setup, go-live gate). Do not scaffold from scratch; the export already carries CI, lint, owner-scoped data and tests. For reference only, the starter was generated with:

```bash
pnpm dlx @tanstack/cli@latest create my-app \
  --package-manager pnpm \
  --deployment cloudflare \
  --add-ons drizzle,better-auth,shadcn,tanstack-query \
  --yes --non-interactive --no-git --no-toolchain
```

**Day-one shape = one package.** Swap scaffold Postgres → **D1**. Reference implementation: `examples/smoke` (see `STACK.md`). Do not create `apps/web` + `apps/server` + four packages + Alchemy on day one.

## Non-negotiables

- **Node 24** + **pnpm**. No npm/yarn. Bun/Deno not required baselines. Nub is optional local (`nub run` / `nubx`), not the lockfile.
- **Vite 8 + Rolldown** for new apps; `rolldown-vite` only as Vite 7 bridge.
- **Drizzle 0.4x** until v1 stable + migration plan.
- **Oxlint + Oxfmt**. React plugin + `correctness`. No ESLint/Prettier/Biome/Ultracite. No hand-wired `oxc-transform-react`.
- **TypeScript 7 `tsc`** for typecheck; keep TypeScript 6 compatibility only where a tool needs its compiler API. Respect the smoke reference's pending migration instead of claiming it already matches.
- Validate env with **Zod**. Secrets via **Infisical**. Never commit real `.env` / `.dev.vars`.
- UI: **Tailwind v4 + shadcn/ui**. When requested, install the exact official component/block with `pnpm dlx shadcn@latest add <item>` before customizing it. Never recreate a shadcn lookalike.
- AI: **TanStack AI + AI Gateway**. Bounded/authorized tools, budgets, traces, and evals. Uploads: R2 (+ D1 metadata).
- Deploy: **Workers**. Wrangler / Git-connect baseline; optional `cf` beta toolbox, project commands only after migration. Alchemy 2 via protected CI only after its adoption gate. Read `docs/cloudflare-tooling.md` for either tooling change.

## Grow on triggers only

| Trigger | Add |
| --------- | ----- |
| API boundary / non-UI clients | Hono + ORPC |
| Thick feature API | slices: `router.ts` thin, `service.ts` + Drizzle direct |
| Second deployable / shared package | monorepo |
| Shared resource lifecycle, repeatable stages/previews, multi-account ownership | Evaluate Alchemy 2; written need + pinned pilot before adoption |
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
- Data fetching: prefer existing repo patterns; `invalidateQueries` default. See `docs/recipes.md` and `docs/gotchas.md`; shared live state requires a written multi-user trigger.
- UI lint: `@shadcn/lint` through Oxlint; use `docs/recipes.md` for the initial `no-restyle` policy. Lint does not replace browser/accessibility verification.
- Long guides are depth, not law.

## Deep references

Resolve `docs/<slug>.md` in this repo.

| Need | Read |
| ------ | ------ |
| Law | `docs/stack-contract.md` |
| Agent entry | `AGENTS.md` |
| Gotchas | `docs/gotchas.md` |
| Recipes | `docs/recipes.md` |
| cf / Alchemy 2 | `docs/cloudflare-tooling.md` |
| Astro / client CMS | `docs/astro.md`, then `docs/astro-emdash.md` when clients edit |
| Security | `docs/security-model.md` |
| AI and coding agents | `docs/agent-factory.md` |
| Proof | `examples/smoke` |
