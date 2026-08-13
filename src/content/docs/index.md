---
title: "Documentation Hub"
verified: 2026-06
---

[Disponible en francais](./fr/)

**[Stack Contract](/stack-contract/) is law.** This hub is the map. Sidebar group **Depth (not law)** holds long optional guides — do not treat them as defaults.

![Starlight publishing architecture](/diagrams/starlight-publishing.svg)

## Recommended Reading Paths

### Starting a new project

1. [Stack Contract](/stack-contract/)
2. [Stack Overview](/stack-overview/)
3. [Recipes](/recipes/)
4. [Tooling](/tooling/)
5. [React Best Practices](/react-best-practices/)
6. [Code Patterns](/code-patterns/) only when you need a copy-paste example

### Building with AI

1. [AI Index](/ai-index/)
2. [Agent Operating Contract](/agent-operating-contract/)
3. [Security Model](/security-model/)
4. [TDD with AI](/tdd-with-ai/)
5. [Gotchas](/gotchas/)
6. [MCP Guide](/mcp-guide/) when tools need wiring

### Shipping to production

1. [Deployment Guide](/deployment/)
2. [Environment and Secrets](/environment-secrets/)
3. [Cloudflare API Tokens](/cloudflare-api-tokens/)
4. [Security Model](/security-model/)
5. [Observability](/observability/)
6. [Email](/email/) when sending/receiving mail

### Content and product surfaces

1. [Astro SEO Guide](/astro-seo-guide/)
2. [TanStack Data Fetching](/tanstack-data-fetching/)
3. [Offline-First Guide](/offline-first-guide/) — depth only; Query persist is default

## Guides by Topic

### Foundations

| Guide | Use it for |
|-------|------------|
| [Stack Contract](/stack-contract/) | **Law** — defaults, shape, gates, authority |
| [AI Index](/ai-index/) | Minimum agent entry path |
| [Stack Overview](/stack-overview/) | Why the defaults and escape hatches |
| [Tooling](/tooling/) | Oxlint, Oxfmt, Vite, Vitest, tsgo, Playwright |
| [Recipes](/recipes/) | Short task paths |
| [Gotchas](/gotchas/) | High-signal traps |
| [Migration Guide](/migration/) | Scaffold → production depth |
| [Development Strategy](/development-strategy/) | Optional UI-first delivery style (not law) |
| [Code Patterns](/code-patterns/) | Pattern museum — copy only what you need |
| [React Best Practices](/react-best-practices/) | React rules for agents and PRs |

### AI and Workflow

| Guide | Use it for |
|-------|------------|
| [Agent Operating Contract](/agent-operating-contract/) | What agents may and may not do |
| [AI Development Workflow](/ai-development-workflow/) | Daily collaboration model |
| [Security Model](/security-model/) | Secrets, agents, Cloudflare authority, injection, prod gates |
| [AI Providers](/ai-providers/) | Workers AI, AI Gateway, Replicate |
| [MCP Guide](/mcp-guide/) | Tool loading and Cloudflare tooling |
| [TDD with AI](/tdd-with-ai/) | Red/green/refactor with AI |
| [Testing Guide](/testing/) | Vitest, Playwright, and test structure depth |
| [Debugging](/debugging/) | Console, browser, and edge debugging |

### Shipping and Hardening

| Guide | Use it for |
|-------|------------|
| [Deployment Guide](/deployment/) | Wrangler-first deploy, CI/CD, bindings |
| [Environment and Secrets](/environment-secrets/) | One secrets manager, Worker secrets |
| [Cloudflare API Tokens](/cloudflare-api-tokens/) | Least-privilege tokens and Wrangler auth |
| [Observability](/observability/) | Workers Observability + optional Sentry |
| [Email](/email/) | Inbound/outbound email splits |
| [App Improvement Guide](/app-improvement-guide/) | Hardening depth |
| [Local Toolchain Snapshot](/local-toolchain/) | Machine snapshot (not law) |
| [Cloudflare Compute](/cloudflare-compute/) | Worker vs Dynamic Worker vs Container |

### Frontend and Product Surfaces

| Guide | Use it for |
|-------|------------|
| [TanStack Data Fetching](/tanstack-data-fetching/) | Loaders vs queries |
| [Astro SEO Guide](/astro-seo-guide/) | SEO for content sites |
| [Rybbit Analytics](/rybbit-analytics/) | First-party analytics proxy |
| [Offline-First Guide](/offline-first-guide/) | Depth only — full offline is project-specific |

## Notes

- French translations live in [`fr`](./fr/). English contracts win on drift.
- Machine-specific details belong in [Local Toolchain Snapshot](/local-toolchain/), not law pages.
- One-off project quirks stay in the project, not this handbook.
