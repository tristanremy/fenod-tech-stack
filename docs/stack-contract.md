---
title: "Stack Contract"
description: "Law for Fenod stack defaults. Other pages explain; this page resolves conflicts."
verified: 2026-06
---

This page is **law**. If another page is longer, newer-looking, or more detailed, this page still wins unless a project `STACK.md` / repo AGENTS explicitly overrides a line.

One-liner:

> Node 24 + pnpm. TanStack Start + Workers. Drizzle/D1 + Better Auth. Tailwind v4 + shadcn. Wrangler. Oxlint + Oxfmt. Infisical + Worker secrets. Hono/ORPC only when an API boundary needs it. Smallest gate. No secrets in git, no prod authority for agents, no stack thrash.

## Authority

| Rank | Source | Wins when |
|------|--------|-----------|
| 1 | This contract | always, unless a project override exists |
| 2 | Project `STACK.md` / repo AGENTS | project-specific lines only |
| 3 | Skills + recipes | how to implement law |
| 4 | Long guides | rationale and depth only |

`AGENTS.md`, `llms.txt`, and Fenod skills must match this page. Drift is a bug.

**Agents load** `AGENTS.md` then this file, then `docs/gotchas.md`. No French law. No Starlight.

## Defaults

| Area | Law |
|------|-----|
| Language | TypeScript strict |
| Local/CI runtime | **Node 24** + **pnpm** |
| App | **TanStack Start** on **Cloudflare Workers** |
| Content / docs / marketing | **Astro** (Starlight for docs) on Workers static assets |
| API | Start server functions first. **Hono + ORPC** only when you need a real API boundary or non-UI clients |
| Data | **Drizzle** latest patched **0.4x** + **D1** |
| Auth | **Better Auth** latest patched stable line (review majors; ship security patches fast) |
| UI | **Tailwind v4 + shadcn/ui** |
| Client data | **TanStack Query + Router** (Form/Table when needed) |
| Files | **R2** + metadata in D1 |
| Cache / config | **KV** — not a database |
| Async work | **Queues / Workflows** |
| Stateful coordination | **Durable Objects** only when needed |
| Edge cache | Workers Cache + `Cache-Control` / `Cache-Tag` for public SSR and cacheable GET APIs |
| AI in apps | **TanStack AI** + **Cloudflare AI Gateway** (provider keys in gateway, never in the browser); bounded tools, authorization, budgets, traces, and evals |
| Deploy | **Workers**, never new Pages. **One Worker** → Git-connect or CI `wrangler deploy`. **2+ Workers that share bindings** → **Alchemy** via GitHub Action. Agents push Git; they do not deploy. |
| Secrets | **Infisical** + Cloudflare Worker secrets at runtime |
| Observability | Workers Observability on every Worker; **Sentry** only for product / paying apps |
| Rate limits | Cloudflare-native binding or DO — **no Redis** |
| Lint | **Oxlint** (`pnpm lint`). React apps: plugin `react` + `correctness` (Compiler rules). Type-aware lint is not CI default until TypeScript 7 is the repo baseline. |
| Format | **Oxfmt** (`pnpm format` / `pnpm format:check`) |
| Types | **tsgo** for `typecheck`; keep **`typescript`** installed for editor/tooling APIs |
| Unit/integration tests | **Vitest** |
| Browser tests | **Playwright** for real UI flows |
| Bundler | **Vite 8 + Rolldown** for new projects; `rolldown-vite` only as a Vite 7 bridge |
| Internal packages | **tsdown** when a package must build artifacts |

### Do not use by default

- npm / yarn
- Nub as the repo package manager (`nub.lock`, `packageManager: nub@…`). Optional local `nub run` / `nubx` only.
- Bun or Deno as required repo baselines
- Prisma
- Postgres (until an escape hatch trigger below)
- Express when Hono fits
- tRPC when the stack choice is ORPC
- Vercel AI SDK for new app code unless an unsupported workflow forces it
- Clean / hexagonal ceremony for small apps
- repository interfaces around Drizzle without real pain
- Alchemy as day-one deploy for a one-Worker app
- Cloudflare Pages for new projects
- Git-connecting each Worker in an Alchemy monorepo
- `wrangler deploy` / `alchemy deploy` from an agent session to staging or prod
- Redis
- Global API Key or broad account-scoped deploy tokens
- plaintext secrets in Git, prompts, issues, or client bundles
- Drizzle v1 RC on client work before a written migration plan
- unreviewed major upgrades of auth / RPC / ORM

## Shape

### Day-one app

One package. Not a monorepo.

```txt
app/
  src/           # UI + server entry
  wrangler.jsonc
  package.json
```

Scaffold:

```bash
pnpm dlx @tanstack/cli@latest create my-app \
  --package-manager pnpm \
  --deployment cloudflare \
  --add-ons oRPC,drizzle,better-auth,shadcn,tanstack-query \
  --yes --non-interactive --no-git --no-toolchain
```

Convert scaffold Postgres defaults to **D1**. Living reference: `examples/smoke` in the handbook repo.

Add Hono only when the HTTP/API boundary needs it. Do not create `apps/web` + `apps/server` + four packages on day one.

### Grow only on triggers

| Trigger | Then add |
|---------|----------|
| Second deployable or shared library across apps | monorepo + packages (+ Turborepo if orchestration hurts) |
| Multiple API consumers or thick procedures | feature slices under `packages/api` or `src/server` |
| 2+ Workers that share D1 / R2 / KV / Queues / domains | **Alchemy** — GitHub Action deploys the smallest unit |
| 4+ Cloudflare resources with shared lifecycle, 3+ real stages, multi-account, or infra-as-code tests | **Alchemy** |
| One Worker (Astro site, one-package Start/Hono app) | **Workers Builds Git-connect** or CI `wrangler deploy` |
| Reporting needs, client Postgres mandate, or D1 limits hit | **Postgres** (+ Hyperdrive if staying on Cloudflare) |
| Users regularly work offline in the field | project-specific offline design — Query persist is enough otherwise |
| Existing docs/static site already on Pages and switching costs more than it saves | keep **Pages** for that site only |

### Feature slices (when an API package exists)

```txt
{api}/routers/{feature}/
├── index.ts
├── router.ts    # validate + expose
└── service.ts   # business logic + Drizzle directly
```

No ports/adapters. No generic repository layer.

## Secrets and Cloudflare authority

- **Infisical** is the default secrets manager. Bitwarden SM only with an explicit project override.
- Commit names and placeholders only (`.env.example`, `infisical.json` without secret values).
- Never commit `.env`, `.env.local`, or `.dev.vars` with real values.
- Local Wrangler must not accidentally prefer an exported token:

```bash
env -u CLOUDFLARE_API_TOKEN wrangler whoami
```

- Production deploys, D1 migrations, DNS, and destroys go through CI / broker / explicit human approval.
- **Who deploys:** the agent never talks to Cloudflare for staging/prod. Push Git. Cloudflare Workers Builds deploys a one-Worker repo. A GitHub Action runs Alchemy for a multi-Worker repo. Do not Git-connect Workers that Alchemy owns — that overwrites bindings outside Alchemy state.
- **Smallest Alchemy unit:** site-only files → site app; admin-only → admin; API/DB/auth/bindings → core; two or more units or shared config → all.
- Pages is not sunset, but it is frozen. New Fenod work is Workers. Do not start new Pages projects.
- AI provider keys: AI Gateway stored keys / BYOK in production.

## Verification

### Ship gate (default done bar)

```bash
pnpm lint
pnpm typecheck
pnpm test
```

### Merge / higher-risk gate

```bash
pnpm build
# UI flows:
pnpm test:e2e
# Visual changes: verify in a browser
```

React Doctor, full monorepo pipelines, and extra scanners are optional merge aids when a repo configures them — not universal law on every edit.

Production-impacting work also needs explicit approval and an audit trail.

## Documentation rules

This repo is agent-first: `AGENTS.md` + these `docs/*.md` + `examples/smoke`. No docs site. Recipes stay short. Long guides do not exist here and do not outrank this contract.

## Related

- [AGENTS.md](../AGENTS.md)
- [Agent operating contract](agent-operating-contract.md)
- [Gotchas](gotchas.md)
- [Recipes](recipes.md)
- [Security](security-model.md)
- [Agent factory](agent-factory.md)
- Living reference: `examples/smoke`
