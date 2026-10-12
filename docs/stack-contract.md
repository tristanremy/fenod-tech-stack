---
title: "Stack Contract"
description: "Law for Fenod stack defaults. Other pages explain; this page resolves conflicts."
verified: 2026-10-11
---

This page is **law**. If another page is longer, newer-looking, or more detailed, this page still wins unless a project `STACK.md` / repo AGENTS explicitly overrides a line.

One-liner:

> Node 24 + pnpm. TanStack Start + Workers. Drizzle/D1 + Better Auth. Tailwind v4 + shadcn. Wrangler. Oxlint + Oxfmt. Infisical + Worker secrets. Hono/ORPC only when an API boundary needs it. Smallest gate. No secrets in git, no prod authority for agents, no stack thrash.

## Authority

| Rank | Source | Wins when |
| ------ | -------- | ----------- |
| 1 | This contract | always, unless a project override exists |
| 2 | Project `STACK.md` / repo AGENTS | project-specific lines only |
| 3 | Skills + recipes | how to implement law |
| 4 | Long guides | rationale and depth only |

`AGENTS.md`, `llms.txt`, and Fenod skills must match this page. Drift is a bug.

**Agents load** `AGENTS.md` then this file, then `docs/gotchas.md`. No French law. No Starlight.

## Defaults

| Area | Law |
| ------ | ----- |
| Language | TypeScript strict |
| Local/CI runtime | **Node 24** + **pnpm** |
| App | **TanStack Start** on **Cloudflare Workers** |
| Content / docs / marketing | **Astro** (Starlight for docs) on Workers static assets for developer-maintained content |
| Direct client content editing | **Astro + EmDash** preferred candidate on a Workers SSR app + D1 + R2; validate the CMS pilot/handoff gate before client production |
| API | Start server functions first. **Hono + ORPC** only when you need a real API boundary or non-UI clients |
| Data | **Drizzle** latest patched **0.4x** + **D1** for applications; EmDash internals use the supported CMS database adapter/schema |
| Auth | **Better Auth** latest patched stable line for applications (review majors; ship security patches fast); EmDash uses its supported CMS auth/Access adapter |
| UI | **Tailwind v4 + shadcn/ui**. Install requested official components and blocks with `pnpm dlx shadcn@latest add <item>`; do not recreate lookalikes. |
| Client data | **TanStack Query + Router** (Form/Table when needed) |
| Files | **R2** + metadata in D1 |
| Cache / config | **KV** — not a database |
| Async work | **Queues / Workflows** |
| Stateful coordination | **Durable Objects** only when needed |
| Edge cache | Workers Cache + `Cache-Control` / `Cache-Tag` for public SSR and cacheable GET APIs |
| AI in apps | **TanStack AI** + **Cloudflare AI Gateway** (provider keys in gateway, never in the browser); bounded tools, authorization, budgets, traces, and evals |
| Cloudflare CLI | **Wrangler** project baseline. **cf** optional beta toolbox; project commands require an explicit, validated migration |
| Deploy | **Workers**, never new Pages. Git-connect or CI **Wrangler** by default. **Alchemy 2** only after a written shared-lifecycle/stage/ownership need and pinned pilot, via protected CI. Agents push Git; they do not deploy. |
| Secrets | **Infisical** → Cloudflare Worker secrets at runtime; validate config with Zod 4 (exact version in the lockfile) |
| Observability | Workers Observability on every Worker: logs, explicit `traces` with deliberate sampling, `redact_query_string`; **Sentry** only for product / paying apps |
| Rate limits | Cloudflare-native binding or DO — **no Redis** |
| Lint | **Oxlint** (`pnpm lint`). React apps: plugin `react` + `correctness` (Compiler rules). Tailwind design systems: **`@shadcn/lint`** through Oxlint (>=1.80), starting with `no-restyle` and layout allowed; component definitions own their variants. See the UI recipe. Type-aware lint is not CI default until TypeScript 7 is the repo baseline. |
| Format | **Oxfmt** (`pnpm format` / `pnpm format:check`) |
| Types | **TypeScript 7** `tsc` for `typecheck`; keep TypeScript 6 only when tooling still needs its compiler API |
| Unit/integration tests | **Vitest 5** |
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
- `wrangler deploy` / `cf deploy` / `alchemy deploy` from an agent session to staging or prod; remote resource commands retain the same authority boundary
- `cf dev` / `cf build` / `cf deploy` in an unmigrated Wrangler project
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
  --add-ons drizzle,better-auth,shadcn,tanstack-query \
  --yes --non-interactive --no-git --no-toolchain
```

Convert scaffold Postgres defaults to **D1**. Living reference: `examples/smoke` in the handbook repo.

Add Hono + oRPC only when the HTTP/API boundary needs it. Do not create `apps/web` + `apps/server` + four packages on day one.

### Content sites and client editing

Use [static Astro](astro.md) when content stays in Git and developers own updates. When clients need direct editing, prefer [Astro + EmDash](astro-emdash.md) with an SSR Worker, D1 and R2. This is a candidate recipe, not a validated Fenod CMS starter.

Keep EmDash's own schema/migrations and supported auth as a **bounded CMS exception**; app features still follow Drizzle/Better Auth defaults. For protected admin, use the supported Access adapter on `/_emdash/*`, with CMS roles for clients and a public website. Request-time published content avoids code rebuilds; prerendered routes and caches need their own update policy.

Before client production, prove edit → draft preview → publish → anonymous page, permission boundaries and recovery of database + media + key rotation list. The [CMS recipe](astro-emdash.md) defines the handoff gate. D1/R2 bindings alone do not justify Alchemy.

### Grow only on triggers

| Trigger | Then add |
| --------- | ---------- |
| Second deployable or shared library across apps | monorepo + packages (+ Turborepo if orchestration hurts) |
| Multiple API consumers or thick procedures | feature slices under `packages/api` or `src/server` |
| Shared resources across Workers, repeatable stages/previews, multi-account ownership, or lifecycle tests | **Evaluate Alchemy 2**; adopt only when a written need and pinned pilot justify the operational cost |
| One Worker (static Astro, Astro + EmDash, one-package Start/Hono app) | **Workers Builds Git-connect** (build command runs the ship gate; GitHub Actions keeps secret scan + `main` e2e, see [CI recipe](recipes.md#ci-for-product-repos)) or CI `wrangler deploy`; no automatic Alchemy |
| Reporting needs, client Postgres mandate, or D1 limits hit | **Postgres** (+ Hyperdrive if staying on Cloudflare) |
| Users regularly work offline in the field | project-specific offline design — Query persist is enough otherwise |
| Existing docs/static site already on Pages and switching costs more than it saves | keep **Pages** for that site only |

Resource counts are evaluation prompts, not automatic adoption rules. For Alchemy 2, first validate Node 24/pnpm, resource adoption without replacement, stage isolation, state backup/recovery and deployment ownership. IaC-only mode can keep a conventional app handler; integrated Effect runtime is optional. See [Cloudflare tooling](cloudflare-tooling.md) for both beta tooling pilots.

### Feature slices (when an API package exists)

```txt
{api}/routers/{feature}/
├── index.ts
├── router.ts    # validate + expose
└── service.ts   # business logic + Drizzle directly
```

No ports/adapters. No generic repository layer.

## Secrets and Cloudflare authority

- **Infisical** is the default secrets manager. Sync it to Cloudflare Worker secrets; Bitwarden SM only with an explicit project override.
- Validate runtime configuration with Zod. Commit names and placeholders only (`.env.example`, `infisical.json` without secret values).
- Never commit `.env`, `.env.local`, or `.dev.vars` with real values. Scan staged changes and enable GitHub push protection when available.
- Varlock is not a default. Use it only after a written trigger. Inventory vars and secrets before deployment; do not assume undeclared secrets are removed. The pinned [S5 pilot](s5-cloudflare-pilot.md) retained an extra secret until explicitly deleted.
- Local Wrangler must not accidentally prefer an exported token:

```bash
env -u CLOUDFLARE_API_TOKEN wrangler whoami
```

- Production deploys, D1 migrations, DNS, and destroys go through CI / broker / explicit human approval.
- **Who deploys:** agents push Git. Staging/prod mutations use protected CI / broker / operator flow, whether the command is Wrangler, `cf` or Alchemy. Workers Builds or CI Wrangler remains the default; CI runs Alchemy only after adoption. Do not Git-connect Workers that Alchemy owns — that overwrites bindings outside Alchemy state.
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
pnpm audit --audit-level high
# UI flows:
pnpm test:e2e
# Visual changes: verify in a browser
```

A green ship gate says nothing about dependency safety; the merge gate includes the audit. The examples expose this gate as `pnpm release`.

React Doctor, full monorepo pipelines, and extra scanners are optional merge aids when a repo configures them — not universal law on every edit.

Production-impacting work also needs explicit approval and an audit trail.

## Documentation rules

This repo is agent-first: `AGENTS.md` + these `docs/*.md` + `examples/smoke`. No docs site. Recipes stay short. Long guides do not exist here and do not outrank this contract.

## Related

- [AGENTS.md](../AGENTS.md)
- [Agent operating contract](agent-operating-contract.md)
- [Gotchas](gotchas.md)
- [Recipes](recipes.md)
- [Cloudflare tooling: cf and Alchemy 2](cloudflare-tooling.md)
- [Astro + EmDash client content](astro-emdash.md)
- [Environment and secrets](environment-secrets.md)
- [Security](security-model.md)
- [Agent factory](agent-factory.md)
- Living reference: `examples/smoke`
