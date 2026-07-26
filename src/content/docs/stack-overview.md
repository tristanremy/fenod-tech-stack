---
title: "Stack Overview"
verified: 2026-06
---

[Disponible en francais](/fr/stack-overview/)

Operating view of the Fenod stack. **[Stack Contract](/stack-contract/) is law.** This page explains the bet and the default path.

## What this stack optimizes for

- Typed product work with minimal ceremony
- Fast shipping to the edge for small teams
- One default path agents and humans can share
- Cloudflare-native primitives over extra vendors
- Strong constraints for AI-assisted development

## Default path

![TanStack Start architecture](/diagrams/tanstack-start-architecture.svg)

| Layer | Default | Why |
|-------|---------|-----|
| Runtime | Node 24 + pnpm | Stable baseline; workspaces without npm/yarn drift |
| App | TanStack Start on Workers | Typed full-stack React at the edge |
| Content | Astro / Starlight on Workers static assets | Content and SEO without app ceremony |
| API | Start server functions → Hono + ORPC when needed | Avoid day-one API framework tax |
| Data | Drizzle 0.4x + D1 | Simple SQL aligned with Workers |
| Auth | Better Auth | TypeScript-first, D1-friendly |
| UI | Tailwind v4 + shadcn/ui | Fast product UI with a maintainable base |
| AI | TanStack AI + AI Gateway | App state + routed provider keys |
| Deploy | Wrangler | One Worker config for most SME apps |
| Secrets | Infisical + Worker secrets | No plaintext env in git |
| Lint/format | Oxlint + Oxfmt via Ultracite | Fast VoidZero path, one repo command |
| Types/tests | tsgo, Vitest, Playwright | Fast check + real behavior |

Day-one shape is **one app package**. Monorepo, Alchemy, Postgres, and full offline are trigger-based — see the Stack Contract.

## Installed does not mean primary

- `node` + `pnpm` are the documented baseline.
- `bun` / `deno` are optional utilities, not repo law.
- Python / Rust are support toolchains when a task needs them.
- Editor choice (Cursor, VS Code, Claude Code, etc.) is personal, not stack law.

## VoidZero direction

Prefer Vite 8, Vitest, Oxlint/Oxfmt, Rolldown, and tsdown because they match the speed and simplicity goals. Cloudflare’s VoidZero acquisition tightens that alignment and concentrates vendor risk. Accept the concentration for Fenod-owned delivery; keep portable boundaries (SQL, HTTP, TypeScript, explicit export paths).

| Tool | Posture |
|------|---------|
| Vite 8 + Rolldown | default for new projects |
| `rolldown-vite` | Vite 7 migration bridge only |
| Vitest / Playwright | default tests |
| Oxlint + Oxfmt / Ultracite | default lint/format |
| tsgo (+ `typescript` package kept) | default typecheck |
| tsdown | internal package builds |
| Vite+ | experimental prototypes only |

## Escape hatches

| Pressure | Move |
|----------|------|
| Second deployable / shared packages | monorepo |
| Thick multi-consumer API | Hono + ORPC slices |
| Multi-resource / multi-stage infra | Alchemy v2 |
| Reporting, Postgres mandate, D1 ceiling | Postgres (+ Hyperdrive on CF) |
| Field offline | project design; Query persist first |
| Legacy Pages site already wired | keep Pages for that site |

## Why this works with AI

- Strict TypeScript narrows edits
- Small default shape keeps changes local
- Wrangler and Workers are scriptable
- Contracts beat novel-length guides for agents
- Ship gate (`lint` + `typecheck` + `test`) is the done bar

## Related guides

- [Stack Contract](/stack-contract/)
- [AI Index](/ai-index/)
- [Tooling](/tooling/)
- [Deployment](/deployment/)
- [Local Toolchain Snapshot](/local-toolchain/)
