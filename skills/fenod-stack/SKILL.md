---
name: fenod-stack
description: Fenod's opinionated stack for building web apps, sites, and APIs. Use this skill whenever starting a new Fenod project, scaffolding an app, choosing between frameworks (TanStack Start, Astro, Hono), structuring a monorepo, writing API routers or services, configuring TypeScript, or picking UI libraries — even if the user just says "new project", "new app", "new client site", or asks how something should be organized in a Fenod codebase.
---

# Fenod Stack

Opinionated defaults for every Fenod project. Follow these unless the project explicitly documents a deviation. When in doubt, the deep references below are authoritative.

## Decision matrix

| Need | Stack | Deploy |
|------|-------|--------|
| Full-stack app | TanStack Start + Hono + ORPC + Drizzle + D1 + Better Auth | CF Workers |
| Content + SEO site | Astro (+ TanStack Start islands if needed) | CF Workers (static assets) |
| SPA (no SEO) | TanStack Start | CF Workers |
| API only | Hono + ORPC + Drizzle | CF Workers |
| Docs site | Starlight | CF Workers (static assets) |
| Monorepo | Add Turborepo to any of the above | — |

Deploy static and content sites as **Workers with static assets**, not Cloudflare Pages. Cloudflare directs new projects to Workers; Pages is legacy-only for existing projects. Use `run_worker_first` for selective dynamic routing in front of static assets.

## Scaffolding

```bash
pnpm create @tanstack/start@latest my-app \
  --add-ons oRPC,drizzle,better-auth,shadcn,tanstack-query,cloudflare
```

Hono must be added manually after scaffolding if needed as the HTTP layer. The scaffold is a starting point — read `src/content/docs/migration.md` to take it to production shape.

## Non-negotiable defaults

- Runtime **Node 22**, package manager **pnpm**. Never switch package managers. Never make Bun/Deno required for normal commands.
- **TypeScript strict mode** plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`. Full tsconfig in the `src/content/docs/stack-overview.md` of the stack repo.
- Validate every environment with **Zod** at startup; never trust raw `process.env` or Worker `env`.
- Styling: **Tailwind v4 + shadcn/ui** base. Production polish: Intent UI, RE UI. Marketing blocks: Tailark, shadcnblocks.
- Payments: Polar.sh. Uploads to R2: Better Upload. AI features: TanStack AI.

## Slices architecture (not layers, not hexagonal)

Each feature owns its router, service, and types in one folder:

```
packages/api/src/routers/
├── {feature}/
│   ├── index.ts       # Public exports
│   ├── router.ts      # ORPC endpoints — thin, delegates to service
│   └── service.ts     # Business logic + Drizzle calls, directly
└── index.ts           # Root router
```

Services import `drizzle-orm` directly — no repository interfaces, no ports/adapters. We are committed to D1/SQLite; abstraction layers are YAGNI here. Extract abstractions only when pain emerges. Rationale and trade-off table: `src/content/docs/stack-overview.md` ("Why Not Hexagonal").

## Monorepo layout

```
my-app/
├── apps/
│   ├── web/          # TanStack Start frontend
│   └── server/       # Hono + ORPC backend
├── packages/
│   ├── api/          # ORPC routers (slices)
│   ├── auth/         # Better Auth config
│   ├── db/           # Drizzle schemas + migrations
│   └── shared/       # Types, errors, env validation
├── turbo.json
└── alchemy.run.ts    # Cloudflare IaC
```

## Rules for agents working in a Fenod codebase

- Match existing patterns in the repo before introducing new ones.
- Keep routers thin; put logic in services. Changes stay inside the feature folder.
- Data fetching: decide Query vs Router loaders per `src/content/docs/tanstack-data-fetching.md` — read it before wiring data flow.
- React work follows `src/content/docs/react-best-practices.md` (security, accessibility, PR rules).
- Concrete code examples for API, auth, forms, Workflows, Queues, Vectorize, Agents: `src/content/docs/code-patterns.md` — large file, search it by section rather than reading whole.

## Deep references

Resolve `src/content/docs/<slug>.md` in this order:
1. `../../src/content/docs/<slug>.md` relative to this skill (when working inside the `fenod-tech-stack` checkout);
2. `~/dev/fenod-tech-stack/src/content/docs/<slug>.md` (local sibling checkout);
3. `https://raw.githubusercontent.com/tristanremy/fenod-tech-stack/main/src/content/docs/<slug>.md` (fetch).

| When you need | Read |
|---------------|------|
| Defaults and trade-offs | `STACK-OVERVIEW.md` |
| Scaffold → production | `MIGRATION.md` |
| Code examples (API, auth, forms, CF primitives) | `CODE-PATTERNS.md` |
| Query vs loaders | `TANSTACK-DATA-FETCHING.md` |
| React rules | `REACT-BEST-PRACTICES.md` |
| SEO on Astro | `ASTRO-SEO-GUIDE.md` |
| PWA / offline | `OFFLINE-FIRST-GUIDE.md` |
| UI-first phased delivery | `DEVELOPMENT-STRATEGY.md` |
