---
title: "AI Index"
description: "Fast entry point for AI agents using the Fenod stack."
verified: 2026-06
---

If you are an AI agent working in a Fenod project, read this page first. It points to the minimum context needed to make good stack decisions without loading the whole handbook.

## Read First

1. [Stack Contract](/stack-contract/)
2. [Agent Operating Contract](/agent-operating-contract/)
3. [Gotchas](/gotchas/)
4. [Recipes](/recipes/)
5. [Security Model](/security-model/)
6. [Cloudflare API Tokens](/cloudflare-api-tokens/)

## Default Mental Model

Fenod projects are Cloudflare-first, TypeScript-first, and agent-assisted. Prefer simple, typed, edge-friendly architecture over enterprise abstraction layers.

## Fast Defaults

| Area | Default |
|------|---------|
| Runtime | Node 22 |
| Package manager | pnpm |
| App | TanStack Start |
| API | Hono + ORPC |
| Database | Drizzle + D1 |
| Auth | Better Auth |
| Styling | Tailwind v4 + shadcn/ui |
| AI | TanStack AI + Cloudflare AI Gateway |
| Deploy | Cloudflare Workers/Pages + Alchemy |
| Secrets | Infisical + Cloudflare Worker secrets |
| Quality | Ultracite, tsgo, Vitest, Playwright |

## Agent Rule of Thumb

When unsure, choose the smallest implementation that follows the stack contract, preserves type safety, and can be verified with repo scripts.
