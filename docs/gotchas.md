---
title: "Gotchas"
description: "High-signal traps in the Fenod stack."
verified: 2026-09
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

## D1 Batch Atomicity Is Not `Promise.all`

`Promise.all` starts independent statements; it does not make a multi-table write atomic. Use Drizzle `db.batch` for statements that must commit or roll back together. A read performed before the batch can become stale, so recheck the invariant inside the batch. A conditional update or compare-and-set that affects zero rows does not fail the batch by itself: inspect its result when no later writes depend on it, or make a later statement fail a database constraint when the guarded write lost the race. Test a real failure after the first statement and prove that no partial rows remain.

## D1 and R2 Are Not One Transaction

D1 and R2 cannot commit atomically together. Persist an explicit lifecycle state in D1, write the object to an idempotent R2 key, then finalize the D1 metadata. On failure, store a non-success state and let a retry reuse the same immutable identifier instead of consuming another one. Define how stale in-progress states recover before production; never label a document issued while its required object is unavailable.

## Parallel N+1 Is Still N+1

`Promise.all(rows.map(loadDetail))` still issues one or more database reads per row. On Workers/D1, this can queue subrequests and dominate page latency. Use scoped set-based reads and test query counts as fixtures grow. Fetching all history once is not server pagination. See [Diagnose slow data loading](recipes.md#diagnose-slow-data-loading).

## Router Preload Is Not Query Freshness

Do not copy `defaultPreloadStaleTime: 0` into a loader-only app without a reason: it can refetch data already loaded by intent preloading. That setting fits a Query-owned cache only when loaders actually use Query. Cache private data per user and invalidate it after writes; retain server authorization even when a parent route already checked the session.

## Browser Stores Need a Stable SSR Snapshot

With `useSyncExternalStore`, `getServerSnapshot` must produce the same initial value on the server and during browser hydration. Do not return a module-level store populated from localStorage or development fixtures in the browser while SSR sees an empty store. For browser-only data, use a stable empty snapshot for SSR/hydration, then let `getSnapshot` expose the browser state. Test hydration with populated storage; an empty-store SSR test alone can miss the bug. Do not hide the mismatch with `suppressHydrationWarning`.

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

Optional laptop: `nub run` / `nubx`. Repo law stays **pnpm**, pinned by `packageManager` and `pnpm-lock.yaml`. Do not `nub pm use nub`. Update pnpm deliberately through its official release channel; do not assume the npm `latest` tag selects the intended major.

## Shadcn Means the Official CLI

When a task asks for a shadcn component or block, use `pnpm dlx shadcn@latest add <item>`. Do not substitute custom primitives or a similar layout. Customize the installed component only after the official baseline exists.

## Oxlint + Oxfmt, Not ESLint/Prettier

Lint is Oxlint, format is Oxfmt. Do not add ESLint, Prettier, Biome, or Ultracite beside them “for completeness.”

## TypeScript 7 Needs a Tooling Check

Use stable TypeScript 7 `tsc` for typechecks. Do not retain `@typescript/native-preview` / `tsgo` by habit. TypeScript 7 does not yet expose the historical compiler API; keep the TypeScript 6 compatibility package only when a proven tool still needs it.

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
