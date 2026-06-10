---
title: "Recipes"
description: "Canonical implementation recipes for common Fenod stack tasks."
verified: 2026-06
---

## Start a Full-Stack App

Use TanStack Start with add-ons, then add Hono manually if the app needs a dedicated API layer.

```bash
pnpm create @tanstack/start@latest my-app \
  --add-ons oRPC,drizzle,better-auth,shadcn,tanstack-query,cloudflare
```

## Add an API Feature

Create a feature slice:

```txt
packages/api/src/routers/{feature}/
├── index.ts
├── router.ts
└── service.ts
```

Keep `router.ts` thin. Put business logic and Drizzle calls in `service.ts`.

## Add Auth

Use Better Auth with D1. Keep auth config server-side and validate session state at API boundaries.

## Add AI Chat

Use:

- TanStack AI for chat/tool/streaming state
- `@cloudflare/tanstack-ai` for Workers AI / AI Gateway
- Cloudflare AI Gateway stored provider keys in production

Do not expose provider keys to the browser.

## Add File Uploads

Use R2 for object storage and D1 for metadata. Keep upload authorization server-side.

## Add Email

Inbound:

```txt
Cloudflare Email Routing → Email Worker → Queue/D1/R2
```

Outbound transactional:

```txt
Server-side app policy → Queue → Resend/Postmark
```

Marketing:

```txt
Lifecycle email platform
```

## Add Analytics

Use a first-party proxy for privacy-friendly analytics when possible. Store public site IDs as public config and provider hosts as non-secret vars.

## Add Offline Support

Only implement full offline-first if users work in dead zones or unstable networks. Otherwise TanStack Query cache is usually enough.

## Deploy Docs

This repo is a Starlight site.

```bash
pnpm build
```

Cloudflare Pages:

```txt
Build command: pnpm build
Output directory: dist
Production branch: main
Custom domain: stack.fenod.fr
```

## Add a Diagram

1. Add Mermaid source to `src/diagrams/name.mmd`.
2. Run `pnpm diagrams:build`.
3. Embed with:

```md
![Diagram title](/diagrams/name.svg)
```
