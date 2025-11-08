# The Fenod Stack

> Modern TypeScript web stack - The official tech stack from [Fenod](https://www.fenod.fr)

## What is the Fenod Stack?

The Fenod Stack is the curated collection of modern web technologies used by Fenod, a digital agency specializing in fast, type-safe, and scalable applications. This stack leverages Cloudflare's edge infrastructure, TanStack's powerful tooling, and the best libraries from the React ecosystem.

**Created and maintained by:** [Fenod Digital Agency](https://www.fenod.fr)

## 💡 Philosophy

This stack prioritizes:
- **Cloudflare-first infrastructure** ☁️ - Leverage CF tools whenever possible
- **Type safety** 🔒 - End-to-end TypeScript with strong typing
- **Modern DX** ✨ - Best-in-class developer experience
- **Performance** ⚡ - Edge-first architecture
- **Simplicity** 🎯 - Minimal configuration, maximum productivity

---

## 📑 Table of Contents

### Core Documentation
- [Getting Started](#-getting-started)
- [Quick Start](#-quick-start)
- [Architecture](docs/architecture.md) - System design, diagrams, and data flow
- [Development Strategy](docs/development-strategy.md) - UI-first workflow guide
- [Local Development](docs/local-development.md) - Docker setup and dev environment
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions
- [Architecture Decisions](docs/decisions/) - Why we chose each technology

### Stack Components
- [Infrastructure & Deployment](#-infrastructure--deployment)
- [Application Framework](#-application-framework)
- [API Development](#-api-development)
- [Authentication & Authorization](#-authentication--authorization)
- [File Management](#-file-management)
- [Styling & UI](#-styling--ui)
- [TanStack Ecosystem](#-tanstack-ecosystem)
- [Monorepo & Build Tools](#-monorepo--build-tools)
- [Payments & Subscriptions](#-payments--subscriptions)
- [Documentation](#-documentation)
- [AI Integration](#-ai-integration)

### Quick Reference
- [Decision Tree](#-decision-tree)
- [Quick Start Templates](#-quick-start-templates)
- [Resources](#-resources)

### Governance
- [Contributing & Governance](#-contributing--governance)
- [Version Matrix](docs/versions.md)
- [Stack Changelog](STACK_CHANGELOG.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

## 🎯 Getting Started

**New to the Fenod Stack?** Start with these guides:

### 📚 Essential Documentation

1. **[Architecture Guide](docs/architecture.md)** - Understand how all pieces fit together
   - Full-stack data flow diagrams
   - Cloudflare edge deployment architecture
   - Authentication flow
   - Request lifecycle
   - Performance characteristics

2. **[Development Strategy](docs/development-strategy.md)** - UI-first workflow with code examples
   - 9-phase development process
   - Complete code examples for each phase
   - shadcn/ui setup and usage
   - Database schema design from UI requirements
   - Type-safe API implementation
   - Production deployment checklist

3. **[Local Development Setup](docs/local-development.md)** - Get your environment running
   - Docker Compose configuration
   - Database options (PostgreSQL, D1, SQLite)
   - Environment variables setup
   - Testing locally
   - VS Code configuration

4. **[Troubleshooting Guide](docs/troubleshooting.md)** - Solve common issues fast
   - TanStack Start, ORPC, Drizzle issues
   - Cloudflare D1, Better Auth problems
   - Build, deployment, and performance fixes

5. **[Architecture Decisions](docs/decisions/)** - Understand our technology choices
   - Why TanStack Start over Next.js
   - Why ORPC over tRPC
   - Why Drizzle over Prisma
   - Why Cloudflare over Vercel/AWS

---

## 🚀 Quick Start

### Bootstrap a New Project

The fastest way to start a Fenod Stack project is with **[create-better-t-stack](https://github.com/AmanVarshney01/create-better-t-stack)** - an interactive CLI that scaffolds projects with the exact technologies you need.

```bash
# Using bun (recommended)
bun create better-t-stack@latest

# Or npm
npx create-better-t-stack@latest

# Or pnpm
pnpm create better-t-stack@latest
```

**Visual Builder**: Visit [better-t-stack.dev/new](https://better-t-stack.dev/new) to visually configure your stack and generate the command.

### Recommended Configurations

Choose based on your project type:

#### 1. **Full-Stack Application** (SaaS, Dashboard, Web App)
```bash
# Interactive selections:
Frontend: React + TanStack Start
Backend: Hono
API: ORPC
Database: SQLite (Cloudflare D1) or PostgreSQL
ORM: Drizzle
Auth: Better Auth
Styling: Tailwind CSS + shadcn/ui
Add-ons: Turborepo (if multi-package)
```

**What you get**: Type-safe full-stack app ready for Cloudflare Workers deployment

#### 2. **Content Site with Interactivity** (Marketing, Blog, Docs)
```bash
# Interactive selections:
Frontend: React + TanStack Start
Backend: Hono (optional, for dynamic features)
Styling: Tailwind CSS + shadcn/ui
Add-ons: Starlight (if building documentation)
```

**What you get**: Fast static site with interactive components, ready for Cloudflare Pages

#### 3. **API Service** (Microservice, Backend Only)
```bash
# Interactive selections:
Frontend: None
Backend: Hono
API: ORPC
Database: SQLite (D1) or PostgreSQL
ORM: Drizzle
Auth: Better Auth (if needed)
```

**What you get**: Standalone API service ready for Cloudflare Workers

#### 4. **Monorepo with Multiple Apps**
```bash
# Interactive selections:
Frontend: React + TanStack Start
Backend: Hono
API: ORPC
Database: SQLite or PostgreSQL
ORM: Drizzle
Auth: Better Auth
Add-ons: Turborepo ✓
```

**What you get**: Monorepo structure with shared packages (UI components, utilities, types)

### After Bootstrapping

Once your project is created:

1. **Follow the UI-first workflow**: See [Development Strategy Guide](docs/development-strategy.md)
2. **Configure Cloudflare**: Set up D1, R2, and other services as needed
3. **Setup deployment**: Use [Alchemy](https://alchemy.run) for streamlined Cloudflare deployments

---

## 🏗️ Infrastructure & Deployment

### Cloudflare ☁️
**Primary infrastructure provider**
- Cloudflare Workers for serverless compute
- Cloudflare Pages for static sites
- Cloudflare D1 for SQL databases
- Cloudflare R2 for object storage
- Cloudflare KV for key-value storage
- Cloudflare Images for image optimization and delivery
- Cloudflare Durable Objects when needed

**Rationale:** Deploy at the edge globally, excellent DX, integrated ecosystem

### Alchemy ⚗️
**Deployment & Configuration Management**
- Use [alchemy.run](https://alchemy.run) for deploying and handling configuration
- Streamlines deployment workflows

---

## 🚀 Application Framework

### Framework Selection Guide

**Choose based on your project needs:**

- **Astro alone** 📄 → Pure content, no app logic (fastest, simplest)
- **Astro + TanStack Start** 📄⚡ → Content that needs SEO + interactive app features
- **TanStack Start alone** ⚡ → Full app where SEO doesn't matter

### TanStack Start
**Primary application framework**
- Full-stack React framework
- Built on Vinxi and Nitro
- Type-safe routing and data loading
- Excellent for SPAs and SSR apps

**When to use:** Default choice for any new application

### Astro + TanStack Start
**For content-heavy, SEO-critical applications**
- Integrate Astro as a Vite plugin with TanStack Start
- Reference: [astro-tanstack-start](https://github.com/tannerlinsley/astro-tanstack-start) | [Announcement tweet](https://x.com/tannerlinsley/status/1976720820442747299)
- Best of both worlds: Astro's content capabilities + TanStack Start's interactivity

**When to use:** Marketing sites, blogs, documentation sites, any content requiring strong SEO

---

## 🔌 API Development

### Hono
**Web framework for Cloudflare Workers**
- Ultra-fast, lightweight
- Excellent TypeScript support
- Perfect for edge runtime

### ORPC
**Type-safe RPC layer**
- End-to-end type safety
- Works seamlessly with Hono
- Eliminates API boilerplate

### Drizzle ORM
**Database toolkit**
- Type-safe SQL query builder
- Excellent DX with autocomplete
- Supports Cloudflare D1, PostgreSQL, MySQL
- Drizzle Kit for migrations

**Stack combination:** `Hono + ORPC + Drizzle` for robust, type-safe APIs

---

## 🔐 Authentication & Authorization

### Better Auth
**Modern authentication library**
- Flexible, extensible
- Multiple providers support
- Works great with the edge
- Type-safe session management

**When to use:** Any application requiring user authentication

---

## 📁 File Management

### Better Upload
**File upload handling**
- Optimized for modern stacks
- Handles file uploads efficiently
- Integrates well with R2/S3

---

## 🎨 Styling & UI

### Tailwind CSS v4
**Utility-first CSS framework**
- Latest version with improved performance
- Oxide engine for faster builds
- Best-in-class DX

### shadcn/ui
**Component library**
- Copy-paste components
- Built on Radix UI primitives
- Fully customizable
- Accessible by default

### shadcn Ecosystem & Derived Libraries

**Component Registries:**
- **[Registry Directory](https://registry.directory/)** - Central hub for discovering shadcn components and libraries

**Premium Component Libraries:**
- **[Intent UI](https://intentui.com/)** - Professional component library with comprehensive design system
  - [Design System](https://design.intentui.com/) - Intent UI's design guidelines and patterns
- **[RE UI](https://reui.io/)** - Refined components and patterns for modern applications
- **[Tailark](https://tailark.com/)** - Marketing-focused blocks (hero, pricing, testimonials, CTAs) with 100+ variants
- **[shadcnblocks](https://www.shadcnblocks.com/)** - 959+ premium blocks with Tailwind 4 support
- **[Coss UI](https://coss.com/ui/)** - Modern UI library based on Cal.com's design, built on Base UI
- **[Origin UI](https://originui.com/)** - Beautiful, production-ready components
- **[Tweak CN](https://tweakcn.com/)** - Enhanced shadcn components with extra features
- **[Kibo UI](https://kibo-ui.com/)** - Modern component collection
- **[Animate UI](https://animate-ui.com/)** - Animation-focused components built on shadcn

**When to use:**
- Start with base shadcn/ui for core components
- Use Intent UI or RE UI for polished, production-ready component variants
- Use Tailark or shadcnblocks for marketing pages and landing pages
- Use Coss UI for calendar/scheduling-heavy applications or Cal.com-inspired designs
- Use Origin UI, Tweak CN, Kibo UI for general component enhancements
- Use Animate UI for animation-rich interfaces
- Mix and match components as needed

---

## 🧰 TanStack Ecosystem

Leverage the full TanStack suite:

### TanStack Query
**Data synchronization**
- Server state management
- Caching, background updates
- Optimistic updates

### TanStack Router
**Type-safe routing** (included in TanStack Start)
- File-based or code-based routing
- Type-safe navigation and params

### TanStack Form
**Type-safe form management**
- Schema validation
- Field-level subscriptions
- Great DX

### TanStack Table
**Headless table library**
- Powerful data tables
- Sorting, filtering, pagination
- Fully customizable

---

## 📦 Monorepo & Build Tools

### Turborepo
**Monorepo build system**
- Fast, incremental builds
- Remote caching
- Perfect for multi-package projects
- Pipeline orchestration

**When to use:** Projects with multiple apps/packages

### Ultracite
**Zero-configuration linter & formatter**
- Built on Biome (Rust-based, extremely fast)
- Replaces ESLint + Prettier + Husky
- AI-ready (works with Claude Code, Cursor, Copilot)
- Unified configuration across monorepo packages
- Subsecond code analysis

**When to use:** Any project, especially monorepos. Simplifies code quality tooling to a single dependency.

---

## 💳 Payments & Subscriptions

### Polar.sh
**Modern payment infrastructure**
- Subscriptions and one-time payments
- Built for developers
- Clean API, great DX

---

## 📚 Documentation

### Starlight (Astro)
**Documentation framework**
- Built on Astro
- Beautiful, fast documentation sites
- SEO-optimized
- Great component library

**When to use:** Any project needing public documentation

---

## 🤖 AI Integration

### AI SDK
**AI application development**
- Vercel AI SDK recommended
- Stream AI responses
- Multiple provider support (OpenAI, Anthropic, etc.)
- React hooks for UI integration

### AI SDK Elements
**Pre-built AI UI components**
- [AI SDK Elements](https://ai-sdk.dev/elements/overview) - Ready-to-use AI interface components
- Built on shadcn/ui
- Chat interfaces, streaming displays, message components

**When to use:** Features requiring LLM integration, chat interfaces, AI-powered tools

---

## 🗺️ Decision Tree

### Choosing your framework
1. **Static content site** (blog, landing page, docs): **Astro alone** → Deploy to Cloudflare Pages
2. **Content site + interactivity** (marketing site with product demos, blog with interactive features): **Astro + TanStack Start** → Deploy to Cloudflare Pages
3. **Full app, no SEO needed** (dashboards, internal tools, SPAs): **TanStack Start alone** → Deploy to Cloudflare Workers
4. **API-only service**: **Hono + ORPC + Drizzle** → Deploy to Cloudflare Workers
5. **Multiple projects/packages**: Add **Turborepo**
6. **Documentation site**: **Starlight** (built on Astro)

### Need a specific feature?
- **Auth** 🔐: Better Auth
- **Uploads** 📁: Better Upload
- **Payments** 💳: Polar.sh
- **Forms** 📝: TanStack Form
- **Tables** 📊: TanStack Table
- **Database** 🗄️: Drizzle + Cloudflare D1
- **Styling** 🎨: Tailwind CSS v4 + shadcn/ui
- **AI** 🤖: AI SDK

---

## ⚡ Quick Start Templates

### Fenod Stack - Full-stack App
```
TanStack Start
+ Hono + ORPC
+ Drizzle + D1
+ Better Auth
+ Tailwind + shadcn
→ Deploy to Cloudflare Workers
```

### Fenod Stack - Content Site
```
Astro + TanStack Start
+ Tailwind + shadcn
+ (optional) Better Auth
→ Deploy to Cloudflare Pages
```

### Fenod Stack - API Service
```
Hono
+ ORPC
+ Drizzle + D1
+ Better Auth
→ Deploy to Cloudflare Workers
```

---

## 🔗 Resources

### Core Stack
- [TanStack Start](https://tanstack.com/start)
- [Astro](https://astro.build)
- [Hono](https://hono.dev)
- [ORPC](https://orpc.unnoq.com)
- [Drizzle](https://orm.drizzle.team)
- [Better Auth](https://www.better-auth.com)
- [Better Upload](https://better-upload.dev)
- [Cloudflare Developers](https://developers.cloudflare.com)
- [Turborepo](https://turbo.build)
- [Ultracite](https://github.com/haydenbleasel/ultracite)
- [Polar.sh](https://polar.sh)
- [AI SDK](https://sdk.vercel.ai)

### Tools & CLI
- [create-better-t-stack](https://github.com/AmanVarshney01/create-better-t-stack) - Project bootstrapping CLI
- [better-t-stack.dev/new](https://better-t-stack.dev/new) - Visual stack builder

### UI & Components
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Registry Directory](https://registry.directory/) - Discover shadcn components
- [Intent UI](https://intentui.com/) & [Design System](https://design.intentui.com/)
- [RE UI](https://reui.io/)
- [Tailark](https://tailark.com/) - Marketing blocks
- [shadcnblocks](https://www.shadcnblocks.com/) - Premium blocks collection
- [Coss UI](https://coss.com/ui/) - Cal.com-inspired components
- [Origin UI](https://originui.com/)
- [Tweak CN](https://tweakcn.com/)
- [Kibo UI](https://kibo-ui.com/)
- [Animate UI](https://animate-ui.com/)
- [AI SDK Elements](https://ai-sdk.dev/elements/overview)

---

## 🤝 Contributing & Governance

### How to Contribute

We welcome contributions to improve the Fenod Stack!

- **Documentation Improvements**: Submit a PR for typos, clarifications, or examples
- **Technology Proposals**: Follow our [RFC process](CONTRIBUTING.md#proposing-new-technologies)
- **Bug Reports**: Open an issue with details
- **Questions**: Start a GitHub Discussion

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for detailed guidelines.

### Stack Governance

- **[Version Matrix](docs/versions.md)** - Recommended versions and compatibility
- **[Stack Changelog](STACK_CHANGELOG.md)** - Track all major decisions and changes
- **[Architecture Decisions](docs/decisions/)** - Understand why we chose each technology

### Proposing Changes

Want to add or change a technology?

1. **Read** [Contributing Guidelines](CONTRIBUTING.md)
2. **Create** a proposal in GitHub Discussions
3. **Wait** for community and technical review
4. **Implement** if approved (create ADR, update docs)

**Evaluation Criteria:**
- Alignment with stack principles (40%)
- Maturity & stability (25%)
- Practical benefits (20%)
- Integration complexity (15%)

**Minimum score: 70%** to be considered

### Stay Updated

- **Review Schedule**: Quarterly (Jan, Apr, Jul, Oct)
- **Next Review**: February 2026
- **Security Updates**: Applied immediately
- **Breaking Changes**: Coordinated with migration guides

---

**Last Updated:** November 2025
