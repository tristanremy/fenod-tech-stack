# Application agent entry

Read this file, [STACK.md](./STACK.md), then [README.md](./README.md). This is an **experimental, local-only** starter, not a deployable product.

## Work

- Node 24 + pinned pnpm; use the lockfile. One package, TanStack Start on Workers, Drizzle/D1, Better Auth, Tailwind/shadcn, Oxlint/Oxfmt.
- Start server functions first. Keep validation from `unknown` and session-derived owner predicates in `src/server/items.ts`. Never trust a browser-provided owner id.
- TanStack Query owns item data. Invalidate after writes and clear private data on logout/account change.
- Install named official components first: `pnpm dlx shadcn@latest add <item>`. Customize after installation.
- `.env.schema` is the fixture-only Varlock configuration. No real credentials, vault account, remote bindings or local override files. Never print raw Varlock JSON with real values.
- Do not deploy, provision resources, send mail, run remote migrations, or add production secrets. Remote scripts deliberately fail. Approval for code changes is not approval for those operations.
- Preserve unrelated work. Use small scoped commits. Keep source checks read-only; run generators explicitly.

## Verify

`pnpm ship` checks config, docs, formatting, lint, types and unit tests. `pnpm build` builds Workers and scans fixture canaries. For configuration/binding changes first run `pnpm cf-types`. For routes use `pnpm generate-routes`, then inspect the diff. `pnpm test:e2e` applies local migrations and exercises real auth/CRUD through Chromium; install Chromium with `pnpm exec playwright install chromium` first. Do not point tests at a remote URL.

Report changed files, exact checks, warnings, incomplete work and required approvals. Do not declare production readiness.

## Upstream

An exported app has `starter-provenance.json` with its exact source commit and tree. Products do not auto-update. Review patches and rerun all gates when adopting upstream changes.

[Stack contract](https://github.com/tristanremy/fenod-tech-stack/blob/UPSTREAM_REVISION/docs/stack-contract.md). This application's [STACK.md](./STACK.md) documents the bounded experimental overrides.
