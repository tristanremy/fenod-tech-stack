---
title: "AI Index"
description: "Fast entry point for AI agents using the Fenod stack."
verified: 2026-06
---

If you are an AI agent in a Fenod project, read this first. Load the minimum, then work.

## Read first

1. [Stack Contract](/stack-contract/) — **law**
2. [Agent Operating Contract](/agent-operating-contract/)
3. [Gotchas](/gotchas/)
4. [Recipes](/recipes/)
5. [Security Model](/security-model/)

Only then open long guides.

## Law in one breath

> Node 24 + pnpm. TanStack Start + Workers. Drizzle/D1 + Better Auth. Tailwind v4 + shadcn. Wrangler. Oxlint + Oxfmt via Ultracite. Infisical + Worker secrets. Hono/ORPC only when an API boundary needs it. Smallest gate. No secrets in git, no prod authority, no stack thrash.

## Fast defaults

| Area | Default |
|------|---------|
| Runtime | Node 24 + pnpm |
| App | TanStack Start on Cloudflare Workers |
| Content/docs | Astro / Starlight on Workers static assets |
| API | Start server functions first; Hono + ORPC when needed |
| Database | Drizzle 0.4x + D1 |
| Auth | Better Auth |
| UI | Tailwind v4 + shadcn/ui |
| AI | TanStack AI + AI Gateway |
| Deploy | Wrangler (`wrangler.jsonc` + `wrangler deploy`) |
| Secrets | Infisical + Worker secrets |
| Lint/format | Oxlint + Oxfmt via Ultracite |
| Types | tsgo (+ keep `typescript` installed) |
| Tests | Vitest; Playwright for UI flows |

## Shape

- Day one: **one app package**, not a monorepo.
- No hexagonal / repository theater around Drizzle.
- Alchemy, Postgres, full offline, Pages: **triggers only** — see Stack Contract.

## Rule of thumb

Smallest change that matches the Stack Contract, stays typed, and passes the ship gate:

```bash
pnpm lint && pnpm typecheck && pnpm test
```
