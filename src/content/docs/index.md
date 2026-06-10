---
title: "Documentation Hub"
verified: 2026-06
---

[Disponible en francais](./fr/)

Use this folder as the working map of the Fenod stack. The root `README.md` explains the baseline; these guides explain how to build, test, ship, and improve with it.

![Starlight publishing architecture](/diagrams/starlight-publishing.svg)

## Recommended Reading Paths

### Starting a new project

1. [Stack Overview](/stack-overview/)
2. [Tooling](/tooling/)
3. [Migration Guide](/migration/)
4. [Development Strategy](/development-strategy/)
5. [Code Patterns](/code-patterns/)
6. [React Best Practices](/react-best-practices/)

### Building with AI

1. [AI Development Workflow](/ai-development-workflow/)
2. [Security Model](/security-model/)
4. [MCP Guide](/mcp-guide/)
5. [TDD with AI](/tdd-with-ai/)
5. [Testing Guide](/testing/)
6. [Debugging](/debugging/)

### Shipping to production

1. [Deployment Guide](/deployment/)
2. [Environment and Secrets](/environment-secrets/)
3. [Cloudflare API Tokens](/cloudflare-api-tokens/)
4. [Security Model](/security-model/)
5. [Email](/email/)
6. [App Improvement Guide](/app-improvement-guide/)
5. [Debugging](/debugging/)
6. [Local Toolchain Snapshot](/local-toolchain/)

### Content and product surfaces

1. [Astro SEO Guide](/astro-seo-guide/)
2. [TanStack Data Fetching](/tanstack-data-fetching/)
3. [Offline-First Guide](/offline-first-guide/)

## Guides by Topic

### Foundations

| Guide | Use it for |
|-------|------------|
| [Stack Overview](/stack-overview/) | Choosing the primary defaults and avoiding stack sprawl |
| [Tooling](/tooling/) | VoidZero, Vite, Vitest, Ultracite, tsgo, Rolldown, and tsdown defaults |
| [Migration Guide](/migration/) | Going from scaffold to production-ready project |
| [Development Strategy](/development-strategy/) | Phased delivery and UI-first execution |
| [Code Patterns](/code-patterns/) | Reusable implementation patterns across the stack |
| [React Best Practices](/react-best-practices/) | Simple React rules for agents, PRs, security, accessibility, and React Doctor |

### AI and Workflow

| Guide | Use it for |
|-------|------------|
| [AI Development Workflow](/ai-development-workflow/) | Daily collaboration model with Cursor, Claude Code, MCP, and verification |
| [Security Model](/security-model/) | Secrets, agents, Cloudflare authority, prompt injection, data, and production gates |
| [AI Providers](/ai-providers/) | Workers AI, AI Gateway, Replicate — model guide and provider comparison |
| [MCP Guide](/mcp-guide/) | Dynamic tool loading, browser inspection, and Cloudflare tooling |
| [TDD with AI](/tdd-with-ai/) | Making AI output safer with red/green/refactor loops |
| [Testing Guide](/testing/) | Vitest, Playwright, MSW, React Doctor, and test structure |
| [Debugging](/debugging/) | Console, browser, and edge debugging workflows |

### Shipping and Hardening

| Guide | Use it for |
|-------|------------|
| [Deployment Guide](/deployment/) | Cloudflare deployment, CI/CD, and runtime bindings |
| [Environment and Secrets](/environment-secrets/) | Infisical, Cloudflare secrets, and safe deploy-time environment handling |
| [Cloudflare API Tokens](/cloudflare-api-tokens/) | Least-privilege API tokens, AI-agent guardrails, and secure Wrangler usage |
| [Security Model](/security-model/) | Cross-cutting security model for secrets, agents, data, and production changes |
| [Email](/email/) | Cloudflare inbound email, transactional outbound, deliverability, and agent-safe workflows |
| [App Improvement Guide](/app-improvement-guide/) | Performance, resilience, and operational hardening |
| [Local Toolchain Snapshot](/local-toolchain/) | Auditing what is installed locally and what should stay primary |
| [Cloudflare Compute](/cloudflare-compute/) | Worker vs Dynamic Worker vs Container: when to use each |

### Frontend and Product Surfaces

| Guide | Use it for |
|-------|------------|
| [TanStack Data Fetching](/tanstack-data-fetching/) | Choosing between loaders, queries, and hybrid patterns |
| [Astro SEO Guide](/astro-seo-guide/) | Structured SEO work for content-heavy projects |
| [Rybbit Analytics](/rybbit-analytics/) | First-party Rybbit proxy on Cloudflare Workers / Pages |
| [Offline-First Guide](/offline-first-guide/) | PWA, IndexedDB, sync, and resilience patterns |

## Notes

- French translations live in [`fr`](./fr/).
- Machine-specific details belong in [Local Toolchain Snapshot](/local-toolchain/), not in the root `README.md`.
- Reusable development practices belong in docs; one-off project quirks should stay inside the project itself.
