---
title: "Gotchas"
description: "High-signal traps in the Fenod stack."
verified: 2026-06
---

## Wrangler Token Override

If `CLOUDFLARE_API_TOKEN` is exported locally, Wrangler may use it instead of OAuth and fail with confusing permission errors.

Use:

```bash
env -u CLOUDFLARE_API_TOKEN wrangler ...
```

## Cloudflare Token Scope

Never use the Global API Key. Prefer one resource-scoped token per job:

- Worker deploy
- Pages deploy
- D1 migration
- R2 upload
- DNS edit
- read-only logs/analytics

## D1 Is SQLite

D1 is SQLite-compatible. Do not assume Postgres features, extensions, or migration behavior.

## KV Is Not a Database

KV is eventually consistent and best for config/cache. Do not use it for relational or transactional data.

## R2 Is Object Storage

R2 is for files and blobs. Store metadata in D1 when you need querying, ownership, or lifecycle state.

## Better Auth Secrets

`BETTER_AUTH_SECRET` must be real, long, and server-only. Placeholder values are only acceptable in `.env.example`.

## TanStack Start and Cloudflare

Check runtime compatibility before adding Node-only packages. Cloudflare Workers do not provide a full Node server environment.

## AI Gateway Provider Keys

For production AI apps, prefer AI Gateway stored keys/BYOK. Direct provider keys in Worker secrets are exceptions, not the default.

## Email Split

- Inbound: Cloudflare Email Routing / Email Workers
- Transactional outbound: Resend or Postmark
- Marketing: Loops, Customer.io, or similar

Do not let agents directly send arbitrary email.

## French Docs

French pages should preserve slugs and code identifiers. Translate prose, not package names, commands, API names, or code contracts.

## Diagrams

Mermaid source lives in `src/diagrams/*.mmd`. Generated SVGs live in `public/diagrams/*.svg` and are created by:

```bash
pnpm diagrams:build
```

## Alchemy v1 vs v2

The npm package is `alchemy`, not the legacy Alchemy framework package. Alchemy v2 is an Effect-based rewrite with `Alchemy.Stack(...)` and `Cloudflare.Worker(...)`; v1 examples from old docs or blog posts will not work against v2.

## Redis Does Not Belong in the Default Stack

Use Cloudflare-native primitives: KV for cache, the Workers rate limiting binding for simple limits, and Durable Objects for custom quota semantics. Do not add external Redis for default rate limiting.

## tsgo Does Not Replace the typescript Package

tsgo uses the native TypeScript 7/Corsa toolchain for fast type checks. Keep `typescript` installed side-by-side for tools that consume the legacy Strada programmatic API until the Corsa API stabilizes.
