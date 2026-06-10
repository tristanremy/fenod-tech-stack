---
title: "Stack Contract"
description: "Canonical Fenod stack defaults for humans and AI agents."
verified: 2026-06
---

This page is the contract. If another page is more detailed, use this page to resolve defaults.

## Documentation Rules

- The [Fenod Stack Handbook](./) is the canonical documentation surface.
- English is the Source Locale unless a page explicitly says otherwise.
- Major guides should follow the Guide Shape: Default Path, Gotchas, Agent Notes, and Related Guides.
- Recipes should be Implementation Recipes: exact tools, file locations, commands, gotchas, and verification.
- Diagrams should be Decision Diagrams: useful for boundaries, flows, lifecycle loops, and decision maps.

## Use

- Node 22
- pnpm
- TanStack Start for full-stack apps
- Astro/Starlight for docs and content-heavy sites
- Hono + ORPC for APIs
- Drizzle + D1 for relational data
- Better Auth for authentication
- Tailwind v4 + shadcn/ui for UI foundations
- TanStack Query/Router/Form/Table where relevant
- TanStack AI for app-level chat, tools, streaming, and agent state
- Cloudflare AI Gateway for provider routing, budgets, and stored keys
- Cloudflare Workers as the default runtime for new apps and dynamic sites
- Cloudflare Workers Static Assets for new static/docs/content sites when starting fresh
- Cloudflare Pages only for existing connected docs/static projects where the GitHub integration is already the simplest path
- R2 for files
- KV for config/cache, not relational data
- Queues/Workflows for async jobs
- Durable Objects for stateful coordination
- Alchemy for Cloudflare IaC
- Infisical or Bitwarden Secrets Manager for secrets
- Ultracite + tsgo + Vitest + Playwright for quality gates
- tsdown for internal package builds

## Do Not Use By Default

- npm/yarn instead of pnpm
- Prisma instead of Drizzle
- Postgres unless explicitly requested
- Express when Hono fits
- tRPC when ORPC is the stack choice
- Clean/hexagonal architecture ceremony for small apps
- repository interfaces around Drizzle without real pain
- raw Cloudflare Global API Key
- broad account-scoped deploy tokens
- plaintext `.env` files in Git
- provider keys in client-side code
- Vercel AI SDK for new app code unless an unsupported workflow requires it

## Architecture Rule

Use feature slices:

```txt
packages/api/src/routers/{feature}/
├── index.ts
├── router.ts
└── service.ts
```

Routers validate and expose contracts. Services hold business logic and call Drizzle directly.

## Verification Rule

Before declaring work done, run the smallest relevant ladder:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For UI changes, verify in a browser. For production-impacting changes, require explicit approval and auditability.
