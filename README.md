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
- **[Origin UI](https://originui.com/)** - Beautiful, production-ready components
- **[Tweak CN](https://tweakcn.com/)** - Enhanced shadcn components with extra features
- **[Kibo UI](https://kibo-ui.com/)** - Modern component collection
- **[RE UI](https://reui.io/)** - Refined components and patterns
- **[Animate UI](https://animate-ui.com/)** - Animation-focused components built on shadcn
- **[Intent UI](https://intentui.com/)** - Professional component library
  - [Design System](https://design.intentui.com/) - Intent UI's design guidelines

**When to use:**
- Start with base shadcn/ui
- Explore these libraries for specialized components or enhanced variants
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

**When to use:** Projects with multiple apps/packages

### Ultracite
**Additional tooling**
- [Context: Include specific use cases if known]

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
- [Polar.sh](https://polar.sh)
- [AI SDK](https://sdk.vercel.ai)

### UI & Components
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Registry Directory](https://registry.directory/) - Discover shadcn components
- [Origin UI](https://originui.com/)
- [Tweak CN](https://tweakcn.com/)
- [Kibo UI](https://kibo-ui.com/)
- [RE UI](https://reui.io/)
- [Animate UI](https://animate-ui.com/)
- [Intent UI](https://intentui.com/) & [Design System](https://design.intentui.com/)
- [AI SDK Elements](https://ai-sdk.dev/elements/overview)

---

**Last Updated:** October 2025
