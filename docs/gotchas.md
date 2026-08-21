---
title: "Gotchas"
description: "High-signal traps in the Fenod stack."
verified: 2026-06
---

## Stack Contract Wins

If a skill, scaffold, or blog-shaped page disagrees with [stack-contract.md](stack-contract.md), follow the contract. Stale monorepo/Alchemy/Node 22 examples are fossils.

## Day-One Is One Package

Do not scaffold `apps/web` + `apps/server` + four packages + Turborepo + Alchemy for a single SME app. Start as one package on Workers. Grow on triggers in the Stack Contract.

## Hono/ORPC Are Not Automatic

TanStack Start server functions are enough until you need a real API boundary or non-UI clients. Adding Hono + ORPC on day one is optional cost, not law.

## Wrangler Token Override

If `CLOUDFLARE_API_TOKEN` is exported locally, Wrangler may use it instead of OAuth and fail with confusing permission errors.

```bash
env -u CLOUDFLARE_API_TOKEN wrangler ...
```

## Cloudflare Token Scope

Never use the Global API Key. Prefer one resource-scoped token per job: Worker deploy, Pages deploy, D1 migration, R2 upload, DNS edit, read-only logs/analytics.

## Secrets: Infisical

Default is **Infisical** + Worker secrets at runtime. Bitwarden SM only with an explicit project override. Do not invent a third store or commit real `.env` files.

## D1 Is SQLite

Do not assume Postgres features, extensions, or migration behavior. Escape to Postgres only on Stack Contract triggers.

## KV Is Not a Database

Eventually consistent config/cache only. Relational/transactional data stays in D1 (or Postgres when chosen).

## R2 Is Object Storage

Files/blobs in R2. Metadata, ownership, lifecycle state in D1.

## Better Auth Secrets

`BETTER_AUTH_SECRET` must be real, long, and server-only. Placeholders only in `.env.example`.

## TanStack Start and Cloudflare

Check Worker compatibility before adding Node-only packages. Workers are not a full Node server.

## AI Gateway Provider Keys

Production default: AI Gateway stored keys/BYOK. Direct provider keys in Worker secrets are exceptions.

## Email Split

- Inbound: Cloudflare Email Routing / Email Workers
- Transactional outbound: Resend or Postmark
- Marketing: lifecycle platform

Agents do not send arbitrary email.

## Live Queries Are Not Convex

Default is `invalidateQueries`. D1 has no change feed. A Durable Object room is an escalation, billed, and every write must `notify()`.

## Cloudflare Access Is the Preview Gate

Staging/admin/preview hosts: Access. Public sites: no. Better Auth still owns app sessions.

## compatibility_date Is a Deliberate Bump

New Workers: today's date + `observability.enabled`. Do not paste `nodejs_compat` onto dates `>= 2026-08-04`. Bump a live date only after `wrangler types` and the ship gate.

## Nub Is Not the Package Manager

Optional laptop: `nub run` / `nubx`. Repo law stays **pnpm** (`pnpm-lock.yaml`, `packageManager`, CI). Do not `nub pm use nub`.

## Shadcn Means the Official CLI

When a task asks for a shadcn component or block, use `pnpm dlx shadcn@latest add <item>`. Do not substitute custom primitives or a similar layout. Customize the installed component only after the official baseline exists.

## Oxlint + Oxfmt, Not ESLint/Prettier

Lint is Oxlint, format is Oxfmt. Do not add ESLint, Prettier, Biome, or Ultracite beside them “for completeness.”

## tsgo Does Not Replace the typescript Package

tsgo is the fast typecheck path. Keep `typescript` installed for tooling that still needs the programmatic API.

## Alchemy Is Not Default Deploy

Default is Wrangler or Workers Builds Git-connect for **one Worker**. Use Alchemy when **two or more Workers share bindings**, or on the other contract triggers. Package is `alchemy`; v1 examples are dead. Effect samples are Alchemy-only, not app architecture law.

Do not Git-connect Workers that Alchemy owns. Cloudflare would deploy one script and skip Alchemy state/bindings.

Agents do not deploy. They push Git. Staging/prod credentials stay in GitHub environments.

## Redis Does Not Belong

Use KV, Workers rate limiting bindings, or Durable Objects. No external Redis for default rate limiting.

## Drizzle v1 Is Not Client Default Yet

Stay on latest patched 0.4x until `drizzle-orm` latest is 1.x **and** a migration plan exists. No drive-by RC upgrades.

## Auth/RPC/ORM Security Updates Are Not Optional

Better Auth, ORPC, and Drizzle need automated dependency monitoring plus `pnpm audit --audit-level high`. Majors require explicit review.

## French Docs Are Not Second Law

Translate prose only. Keep slugs, package names, commands, and contracts aligned with English source. When FR drifts, English wins.

## Diagrams

Mermaid: `src/diagrams/*.mmd` → `pnpm diagrams:build` → `public/diagrams/*.svg`.
