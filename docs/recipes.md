---
title: "Recipes"
description: "Short implementation recipes for common Fenod stack tasks."
verified: 2026-09
---

Recipes implement [stack-contract.md](stack-contract.md). Keep them short.

## Start a full-stack app

One package on Workers:

```bash
pnpm dlx @tanstack/cli@latest create my-app \
  --package-manager pnpm \
  --deployment cloudflare \
  --add-ons oRPC,drizzle,better-auth,shadcn,tanstack-query \
  --yes --non-interactive --no-git --no-toolchain
```

Then align with law: **D1 not Postgres**, Oxlint + Oxfmt, Infisical, Wrangler observability.

Living reference in this repo: [`examples/smoke`](https://github.com/tristanremy/fenod-tech-stack/tree/main/examples/smoke) (`STACK.md` maps each law line).

Do not create a monorepo on day one. Add Hono only when you need a dedicated HTTP/API boundary.

## Configure environment and secrets

```bash
infisical run --env=dev -- pnpm dev
infisical scan git-changes --staged
```

Use Infisical as the source of truth and sync sensitive runtime values to Cloudflare Worker secrets. Keep non-secret values in `wrangler.jsonc` `vars`; validate required runtime config with Zod 4.5.x. `.dev.vars` is local-only and ignored. Do not add Varlock unless the application meets its written trigger in [Environment and secrets](environment-secrets.md).

## Add UI components and blocks

When a request names a shadcn component or block, install the **exact official item** first:

```bash
pnpm dlx shadcn@latest add <item>
```

Examples: `button`, `dialog`, or an official sidebar block such as `sidebar-07`. Do not hand-build a visual approximation. Make product changes after installation; this preserves the upstream baseline for later updates.

## Add an API feature

When an API module exists, use a feature slice:

```txt
{api}/routers/{feature}/
├── index.ts
├── router.ts
└── service.ts
```

`router.ts` stays thin. `service.ts` owns business logic and Drizzle.

## Add auth

Better Auth + D1. Server-only config. Validate session at API boundaries.

## Add AI chat

- TanStack AI for chat/tools/streaming state
- `@cloudflare/tanstack-ai` for Workers AI / AI Gateway
- AI Gateway stored provider keys in production
- never expose provider keys to the browser

## Add file uploads

R2 for objects, D1 for metadata, authorize server-side.

## Add email

```txt
Inbound:  Cloudflare Email Routing → Email Worker → Queue/D1/R2
Outbound: app policy → Queue → Resend/Postmark
Marketing: lifecycle platform
```

Agents do not send arbitrary email.

## Add analytics

Prefer a first-party proxy. Public site IDs are config, not secrets.

## Live queries

Default: mutation → `invalidateQueries`. Not Convex. Not Astro islands. Durable Object room only with a written multi-user trigger (see gotchas).

## Diagnose slow data loading

1. Measure one authenticated screen: cold load, navigation, preload then click, and reload after a mutation. Record request count, response bytes, server duration, and D1 query count. Use representative fixtures; do not export production data or credentials.
2. Trace Router `beforeLoad` → loader → server function → D1. Start independent reads with `Promise.all`, not consecutive `await`s. Return the checked user from `beforeLoad` as route context instead of fetching it again for the layout. Keep authorization inside every server boundary.
3. Remove **N+1** reads: fetch the selected parents and their children with set-based, tenant-filtered queries, then group children by parent ID with a `Map`. Do not call a detail loader for every row. Bound `IN` chunks to the current D1 parameter limit, including other bound values; a join can avoid a large ID list. Preserve empty parents, order, null values, and tenant isolation.
4. Bound the payload too: paginate lists on the server, filter by date/status there, and aggregate dashboard figures in SQL. Browser-only pagination still downloads the whole history. Load detail lines, events, PDFs, and export bodies only where needed. Use `EXPLAIN QUERY PLAN` before adding indexes.
5. Choose one cache owner. With Router loaders alone, keep a deliberate preload freshness window; `defaultPreloadStaleTime: 0` discards preload freshness. With Query `ensureQueryData`, Router may delegate freshness to Query with that setting. Define query keys, `staleTime`, mutation invalidation, and cache clearing at logout/account change together. Never add shared caching of private data to hide slow SQL.
6. Leave a regression test that calls the real service and counts database reads for empty, small, and larger fixtures. Assert output equivalence and cross-tenant exclusion. A fixed query count is not a latency measurement: repeat the authenticated browser measurement after the approved release before claiming a production speedup.

Start with the existing Router/Query and D1 tools. Do not add Redis, a new API layer, or a generic cache service to fix avoidable database calls.

## Offline

Default: TanStack Query cache/persist.  
Full offline-first only for real field/dead-zone products — design per project, not as stack scaffolding.

## Deploy an app

**CI or a human-owned terminal only.** Agents push Git; they do not deploy or run remote D1 migrations.

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
env -u CLOUDFLARE_API_TOKEN wrangler deploy
```

CI injects runtime secrets with Infisical (e.g. `infisical run --env=prod -- wrangler deploy`) behind a protected environment. Alchemy only on Stack Contract triggers.
