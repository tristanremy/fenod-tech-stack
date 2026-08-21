---
title: "Recipes"
description: "Short implementation recipes for common Fenod stack tasks."
verified: 2026-06
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


