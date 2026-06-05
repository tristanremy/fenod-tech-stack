<p align="center">
  <a href="https://fenod.fr">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://fenod.fr/favicon.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://fenod.fr/favicon.svg">
      <img alt="Fenod" src="https://fenod.fr/favicon.svg" width="80">
    </picture>
  </a>
</p>

# Fenod Stack

**[Fenod](https://fenod.fr)** builds modern websites, web apps, and AI-powered products using cutting-edge technology. This is our internal reference for the stack, workflows, AI-assisted development patterns, and best practices we use daily.

## Table of Contents

- [Decision Matrix](#decision-matrix)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Core Stack](#core-stack)
- [TypeScript Configuration](#typescript-configuration)
- [Documentation](#documentation)
- [UI Libraries](#ui-libraries)
- [Tools](#tools)
- [Links](#links)

---

## Decision Matrix

| Need | Stack | Deploy |
|------|-------|--------|
| Full-stack app | TanStack Start + Hono + ORPC + Drizzle + D1 + Better Auth | CF Workers |
| Content + SEO | Astro + TanStack Start | CF Pages |
| SPA (no SEO) | TanStack Start | CF Workers |
| API only | Hono + ORPC + Drizzle | CF Workers |
| Docs site | Starlight | CF Pages |
| Monorepo | Add Turborepo to any above | - |

---

## Quick Start

```bash
pnpm create @tanstack/start@latest my-app
```

For the full fenod stack with add-ons:

```bash
pnpm create @tanstack/start@latest my-app \
  --add-ons oRPC,drizzle,better-auth,shadcn,tanstack-query,cloudflare
```

> The official [TanStack CLI](https://github.com/TanStack/cli) scaffolds a TanStack Start project with optional add-ons. Hono must be added manually after scaffolding if needed as HTTP layer. See [Migration Guide](docs/MIGRATION.md) to go from scaffold to production.

---

## Architecture

### Slices Pattern

Feature-based organization instead of technical layers. Each feature contains its own router, service, and types.

```
packages/api/src/routers/
├── {feature}/
│   ├── index.ts       # Public exports
│   ├── router.ts      # ORPC endpoints (thin, delegates to service)
│   └── service.ts     # Business logic + DB operations
└── index.ts           # Root router
```

| Traditional Layers | Slices Architecture |
|-------------------|---------------------|
| `controllers/`, `services/`, `repositories/` | `{feature}/router.ts + service.ts` |
| Cross-cutting changes affect multiple folders | Changes stay within feature folder |
| Technical grouping | Business domain grouping |

### Why Not Hexagonal/Clean Architecture?

Hexagonal architecture (ports & adapters) adds indirection that pays off in large, long-lived enterprise systems. For our context—small teams shipping fast to Cloudflare edge—the overhead isn't worth it:

| Hexagonal | Slices (our choice) |
|-----------|---------------------|
| Abstracts DB behind repository interfaces | Service calls Drizzle directly |
| Domain layer has no framework imports | Service imports `drizzle-orm` |
| Swappable adapters (PostgreSQL → MongoDB) | We're committed to D1/SQLite |
| 4+ files per feature (port, adapter, usecase, entity) | 2 files per feature (router, service) |
| Optimizes for "what if we change X" | Optimizes for "ship and iterate" |

**When hexagonal makes sense:** regulated industries, 10+ year codebases, teams > 20 devs, or genuinely uncertain infrastructure.

**When slices win:** startups, MVPs, small teams, known tech stack, rapid iteration. You can always extract abstractions later when pain emerges—YAGNI until then.

### Monorepo Structure

```
my-app/
├── apps/
│   ├── web/                    # TanStack Start frontend
│   └── server/                 # Hono + ORPC backend
├── packages/
│   ├── api/                    # ORPC routers (slices)
│   ├── auth/                   # Better Auth config
│   ├── db/                     # Drizzle schemas + migrations
│   └── shared/                 # Types, errors, env validation
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── alchemy.run.ts              # Cloudflare deployment
```

---

## Core Stack

### Frontend

| Package | Purpose |
|---------|---------|
| [TanStack Start](https://tanstack.com/start) | Full-stack React framework |
| [TanStack Query](https://tanstack.com/query) | Server state, caching, optimistic updates |
| [TanStack Router](https://tanstack.com/router) | Type-safe routing |
| [TanStack Form](https://tanstack.com/form) | Type-safe forms with validation |
| [TanStack Table](https://tanstack.com/table) | Headless data tables |

### Backend

| Package | Purpose |
|---------|---------|
| [Hono](https://hono.dev) | Lightweight web framework |
| [ORPC](https://orpc.unnoq.com) | Type-safe RPC with OpenAPI |
| [Drizzle](https://orm.drizzle.team) | TypeScript ORM |
| [Better Auth](https://better-auth.com) | Authentication |

### Tooling

VoidZero is the stack direction for fast JavaScript tooling: Vite/Vitest as defaults, Oxlint/Oxfmt through Ultracite where useful, Rolldown for faster builds, `tsdown` for packages, and Vite+ as an experimental new-project lane.

| Tool | Purpose |
|------|---------|
| [Vite](https://vite.dev) | Dev server and framework foundation |
| [Vitest](https://vitest.dev) | Unit and integration tests |
| [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) / Oxfmt | Fast linting and formatting foundation |
| [Rolldown](https://rolldown.rs) | Future-facing bundler path for faster builds |
| [tsdown](https://tsdown.dev) | ESM-first package/library builds |

### Infrastructure (Cloudflare)

Cloudflare is the default deployment target. Use OAuth for local Wrangler work, scoped API tokens for CI/automation, and never hand broad account tokens to AI agents. See [Cloudflare API Tokens](docs/CLOUDFLARE-API-TOKENS.md).

| Service | Purpose |
|---------|---------|
| [Workers](https://developers.cloudflare.com/workers/) | Serverless compute |
| [Pages](https://developers.cloudflare.com/pages/) | Static sites |
| [D1](https://developers.cloudflare.com/d1/) | SQLite database |
| [R2](https://developers.cloudflare.com/r2/) | Object storage |
| [KV](https://developers.cloudflare.com/kv/) | Key-value store |
| [Queues](https://developers.cloudflare.com/queues/) | Message queues |
| [Workflows](https://developers.cloudflare.com/workflows/) | Durable multi-step jobs |
| [Vectorize](https://developers.cloudflare.com/vectorize/) | Vector database (RAG) |
| [Workers AI](https://developers.cloudflare.com/workers-ai/) | AI inference |
| [Durable Objects](https://developers.cloudflare.com/durable-objects/) | Stateful coordination |

---

## TypeScript Configuration

### Strict Mode (Recommended)

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@my-app/api/*": ["./packages/api/src/*"],
      "@my-app/db/*": ["./packages/db/src/*"],
      "@my-app/shared/*": ["./packages/shared/src/*"]
    }
  }
}
```

### Key Settings Explained

| Option | Purpose |
|--------|---------|
| `strict` | Enable all strict type-checking options |
| `noUncheckedIndexedAccess` | Add `undefined` to array/object index access |
| `exactOptionalPropertyTypes` | Distinguish between `undefined` and missing |
| `noPropertyAccessFromIndexSignature` | Force bracket notation for dynamic keys |

### Monorepo Path Aliases

```json
// apps/web/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@my-app/api": ["../../packages/api/src"],
      "@my-app/db": ["../../packages/db/src"],
      "@my-app/shared": ["../../packages/shared/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Documentation Hub](docs/README.md) | Reading paths and categorized documentation map |
| [Stack Overview](docs/STACK-OVERVIEW.md) | Recommended defaults, tradeoffs, and operating mode |
| [Tooling](docs/TOOLING.md) | VoidZero, Vite, Vitest, Ultracite, tsgo, Rolldown, and tsdown defaults |
| [Security Model](docs/SECURITY-MODEL.md) | Secrets, agents, Cloudflare authority, prompt injection, data, and production gates |
| [AI Development Workflow](docs/AI-DEVELOPMENT-WORKFLOW.md) | How Cursor, Claude Code, MCP, and verification fit together |
| [Agent Platform Plan](docs/AGENT-PLATFORM-PLAN.md) | Project-scoped agent runtime, brokered Cloudflare changes, backups, and local DX |
| [TDD with AI](docs/TDD-WITH-AI.md) | Red/green/refactor adapted to AI-assisted delivery |
| [Local Toolchain Snapshot](docs/LOCAL-TOOLCHAIN.md) | Machine audit and recommendations for this setup |
| [Cloudflare Compute](docs/CLOUDFLARE-COMPUTE.md) | Worker vs Dynamic Worker vs Container: when to use each |
| [Cloudflare API Tokens](docs/CLOUDFLARE-API-TOKENS.md) | Least-privilege tokens, secure Wrangler usage, and AI-agent guardrails |
| [AI Providers](docs/AI-PROVIDERS.md) | Workers AI, AI Gateway, Replicate — model guide and provider comparison |
| [Email](docs/EMAIL.md) | Cloudflare inbound email, transactional outbound, deliverability, and agent-safe workflows |
| [Code Patterns](docs/CODE-PATTERNS.md) | API, auth, forms, UI, Workflows, Queues, Vectorize, Agents |
| [Development Strategy](docs/DEVELOPMENT-STRATEGY.md) | UI-first workflow, phased development |
| [Migration Guide](docs/MIGRATION.md) | From TanStack CLI scaffold to production |
| [App Improvement Guide](docs/APP-IMPROVEMENT-GUIDE.md) | Performance, security, error handling |
| [Testing Guide](docs/TESTING.md) | Vitest, Playwright, slice testing, React Doctor quality gates |
| [React Best Practices](docs/REACT-BEST-PRACTICES.md) | Simple React rules for agents, PRs, security, and accessibility |
| [Deployment Guide](docs/DEPLOYMENT.md) | Alchemy, Wrangler (jsonc), CI/CD |
| [Environment and Secrets](docs/ENVIRONMENT-SECRETS.md) | Infisical, Cloudflare secrets, safe deploy env |
| [Data Fetching](docs/TANSTACK-DATA-FETCHING.md) | Query vs Router loaders |
| [Debugging](docs/DEBUGGING.md) | Wrangler tail, DevTools, logging |
| [MCP Guide](docs/MCP-GUIDE.md) | MCP server integration |
| [Astro SEO](docs/ASTRO-SEO-GUIDE.md) | SEO patterns for Astro sites |
| [Offline-First](docs/OFFLINE-FIRST-GUIDE.md) | PWA, IndexedDB, sync strategies |

---

## UI Libraries

| Library | Use For |
|---------|---------|
| [shadcn/ui](https://ui.shadcn.com) | Base components |
| [Intent UI](https://intentui.com) | Production polish |
| [RE UI](https://reui.io) | Production polish |
| [Tailark](https://tailark.com) | Marketing blocks |
| [shadcnblocks](https://shadcnblocks.com) | Marketing blocks |
| [Origin UI](https://originui.com) | Component variants |
| [Animate UI](https://animate-ui.com) | Animations |
| [Registry Directory](https://registry.directory) | Discover more |

---

## Tools

| Tool | Purpose |
|------|---------|
| [Tailwind v4](https://tailwindcss.com) | Styling |
| [Turborepo](https://turbo.build) | Monorepo builds |
| [Ultracite](https://ultracite.dev) | Linting & formatting (Oxlint + Oxfmt backend) |
| [tsgo](https://github.com/microsoft/typescript-go) | Type-checking |
| [Better Upload](https://better-upload.dev) | File uploads to R2 |
| [Polar.sh](https://polar.sh) | Payments |
| [TanStack AI](https://tanstack.com/ai) | Default AI toolkit for chat, streaming, tool calling, and agent workflows |
| [React Doctor](https://www.react.doctor/) | React best-practice, security, performance, and architecture checks before PR merge |
| [Alchemy](https://alchemy.run) | Cloudflare IaC |
| [Infisical](https://infisical.com) | Secret storage and environment injection |
| [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) | Git hooks (pre-commit, pre-push) |

---

## Links

**Core:** [TanStack Start](https://tanstack.com/start) | [Astro](https://astro.build) | [Hono](https://hono.dev) | [ORPC](https://orpc.unnoq.com) | [Drizzle](https://orm.drizzle.team) | [Better Auth](https://better-auth.com)

**Infra:** [Cloudflare](https://developers.cloudflare.com) | [Alchemy](https://alchemy.run) | [Infisical](https://infisical.com) | [Turborepo](https://turbo.build)

**UI:** [shadcn/ui](https://ui.shadcn.com) | [Tailwind](https://tailwindcss.com) | [TanStack AI React](https://tanstack.com/ai)
