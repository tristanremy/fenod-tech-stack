# Documentation Hub

[Disponible en francais](./fr/README.md)

Use this folder as the working map of the Fenod stack. The root `README.md` explains the baseline; these guides explain how to build, test, ship, and improve with it.

## Recommended Reading Paths

### Starting a new project

1. [Stack Overview](./STACK-OVERVIEW.md)
2. [Tooling](./TOOLING.md)
3. [Migration Guide](./MIGRATION.md)
4. [Development Strategy](./DEVELOPMENT-STRATEGY.md)
5. [Code Patterns](./CODE-PATTERNS.md)
6. [React Best Practices](./REACT-BEST-PRACTICES.md)

### Building with AI

1. [AI Development Workflow](./AI-DEVELOPMENT-WORKFLOW.md)
2. [Security Model](./SECURITY-MODEL.md)
3. [Agent Platform Plan](./AGENT-PLATFORM-PLAN.md)
4. [MCP Guide](./MCP-GUIDE.md)
5. [TDD with AI](./TDD-WITH-AI.md)
5. [Testing Guide](./TESTING.md)
6. [Debugging](./DEBUGGING.md)

### Shipping to production

1. [Deployment Guide](./DEPLOYMENT.md)
2. [Environment and Secrets](./ENVIRONMENT-SECRETS.md)
3. [Cloudflare API Tokens](./CLOUDFLARE-API-TOKENS.md)
4. [Security Model](./SECURITY-MODEL.md)
5. [Email](./EMAIL.md)
6. [App Improvement Guide](./APP-IMPROVEMENT-GUIDE.md)
5. [Debugging](./DEBUGGING.md)
6. [Local Toolchain Snapshot](./LOCAL-TOOLCHAIN.md)

### Content and product surfaces

1. [Astro SEO Guide](./ASTRO-SEO-GUIDE.md)
2. [TanStack Data Fetching](./TANSTACK-DATA-FETCHING.md)
3. [Offline-First Guide](./OFFLINE-FIRST-GUIDE.md)

## Guides by Topic

### Foundations

| Guide | Use it for |
|-------|------------|
| [Stack Overview](./STACK-OVERVIEW.md) | Choosing the primary defaults and avoiding stack sprawl |
| [Tooling](./TOOLING.md) | VoidZero, Vite, Vitest, Ultracite, tsgo, Rolldown, and tsdown defaults |
| [Migration Guide](./MIGRATION.md) | Going from scaffold to production-ready project |
| [Development Strategy](./DEVELOPMENT-STRATEGY.md) | Phased delivery and UI-first execution |
| [Code Patterns](./CODE-PATTERNS.md) | Reusable implementation patterns across the stack |
| [React Best Practices](./REACT-BEST-PRACTICES.md) | Simple React rules for agents, PRs, security, accessibility, and React Doctor |

### AI and Workflow

| Guide | Use it for |
|-------|------------|
| [AI Development Workflow](./AI-DEVELOPMENT-WORKFLOW.md) | Daily collaboration model with Cursor, Claude Code, MCP, and verification |
| [Security Model](./SECURITY-MODEL.md) | Secrets, agents, Cloudflare authority, prompt injection, data, and production gates |
| [Agent Platform Plan](./AGENT-PLATFORM-PLAN.md) | Project-scoped agent runtime, brokered Cloudflare changes, backups, and local DX |
| [AI Providers](./AI-PROVIDERS.md) | Workers AI, AI Gateway, Replicate — model guide and provider comparison |
| [MCP Guide](./MCP-GUIDE.md) | Dynamic tool loading, browser inspection, and Cloudflare tooling |
| [TDD with AI](./TDD-WITH-AI.md) | Making AI output safer with red/green/refactor loops |
| [Testing Guide](./TESTING.md) | Vitest, Playwright, MSW, React Doctor, and test structure |
| [Debugging](./DEBUGGING.md) | Console, browser, and edge debugging workflows |

### Shipping and Hardening

| Guide | Use it for |
|-------|------------|
| [Deployment Guide](./DEPLOYMENT.md) | Cloudflare deployment, CI/CD, and runtime bindings |
| [Environment and Secrets](./ENVIRONMENT-SECRETS.md) | Infisical, Cloudflare secrets, and safe deploy-time environment handling |
| [Cloudflare API Tokens](./CLOUDFLARE-API-TOKENS.md) | Least-privilege API tokens, AI-agent guardrails, and secure Wrangler usage |
| [Security Model](./SECURITY-MODEL.md) | Cross-cutting security model for secrets, agents, data, and production changes |
| [Email](./EMAIL.md) | Cloudflare inbound email, transactional outbound, deliverability, and agent-safe workflows |
| [App Improvement Guide](./APP-IMPROVEMENT-GUIDE.md) | Performance, resilience, and operational hardening |
| [Local Toolchain Snapshot](./LOCAL-TOOLCHAIN.md) | Auditing what is installed locally and what should stay primary |
| [Cloudflare Compute](./CLOUDFLARE-COMPUTE.md) | Worker vs Dynamic Worker vs Container: when to use each |

### Frontend and Product Surfaces

| Guide | Use it for |
|-------|------------|
| [TanStack Data Fetching](./TANSTACK-DATA-FETCHING.md) | Choosing between loaders, queries, and hybrid patterns |
| [Astro SEO Guide](./ASTRO-SEO-GUIDE.md) | Structured SEO work for content-heavy projects |
| [Rybbit Analytics](./RYBBIT-ANALYTICS.md) | First-party Rybbit proxy on Cloudflare Workers / Pages |
| [Offline-First Guide](./OFFLINE-FIRST-GUIDE.md) | PWA, IndexedDB, sync, and resilience patterns |

## Notes

- French translations live in [`docs/fr`](./fr/).
- Machine-specific details belong in [Local Toolchain Snapshot](./LOCAL-TOOLCHAIN.md), not in the root `README.md`.
- Reusable development practices belong in docs; one-off project quirks should stay inside the project itself.
