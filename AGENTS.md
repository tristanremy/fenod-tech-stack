# Fenod — agent entry

**Law:** `docs/stack-contract.md`. If anything else disagrees, the contract wins unless the project `STACK.md` / this file overrides a line.

**Reference:** `examples/smoke` (one-package TanStack Start + Workers + D1). It is **experimental**: server functions parse bounded input and scope every row to the signed-in user, and it has a portable export, local and CI browser tests, and a tested local ownership/migration check — but no validated Worker secret/config startup on a deployed target and no production readiness. The 2026-09 disposable pilot was partial and its resources are deleted; see `docs/s5-cloudflare-pilot.md`. Do not deploy it unchanged. See `plans/009-agent-first-audit.md` for the gaps and `plans/010-maintained-starter.md` for the path to a maintained starter.

## Load

1. This file
2. `docs/stack-contract.md`
3. `docs/agent-operating-contract.md`
4. `docs/gotchas.md`
5. `docs/recipes.md`
6. `docs/security-model.md` when touching auth, secrets, Cloudflare, or email
7. `docs/new-project.md` when starting or setting up a client project
8. `docs/errors.md` before adding or changing errors, error messages, HTTP statuses, or retry logic
9. `docs/review-guide.md` before opening a PR
10. `docs/effect-lane.md` only when the project `STACK.md` says `Lane: effect`

Do not load old Starlight pages, French translations, or `code-patterns`.

## Enforce

- Node 24 + **pnpm** (not npm/yarn; Nub is not the lockfile)
- TanStack Start on **Cloudflare Workers**. Astro for marketing/content: static for developer edits; **Astro + EmDash** is the preferred candidate for direct client editing, subject to its pilot/handoff gate (`docs/astro-emdash.md`).
- Drizzle **0.4x** + **D1**. Better Auth. EmDash internals use their supported database/auth adapters, a bounded CMS exception. Tailwind v4 + shadcn. When asked for a shadcn component or block, install the exact official item with `pnpm dlx shadcn@latest add <item>`; do not recreate a lookalike. Customize only after installation.
- Start server functions first. Hono + oRPC only when an API boundary needs it.
- Oxlint + Oxfmt + TypeScript 7 `tsc`. Add `@shadcn/lint` through Oxlint for Tailwind design systems; use the UI recipe's initial policy. Product ship gate: `pnpm lint && pnpm typecheck && pnpm test`
- Infisical + Worker secrets + Zod 4 config validation. Scan staged changes; never commit `.env` / `.dev.vars` with real values.
- Wrangler remains the project baseline. `cf` is an optional beta toolbox; no `cf dev` / `cf build` / `cf deploy` in an unmigrated Wrangler project. Alchemy 2 requires a written infrastructure need and a pinned pilot, not a resource count (`docs/cloudflare-tooling.md`).
- Agents **push Git**. They do not `wrangler deploy` / `cf deploy` / `alchemy deploy` to staging/prod; the same authority rules cover remote resource commands.
- Mutation → `invalidateQueries`. No Convex. No live DO without a written multi-user trigger.
- `wrangler types`. Dates `>= 2026-08-04` already include `nodejs_compat`. Observability on every Worker.
- Fast-moving libraries (TanStack Start, ORPC, Better Auth, Alchemy v2, Effect) drift from training data: read the installed types/source in `node_modules` before using an API you are not sure of.
- No `as` casts (except `as const`), no `any`, no non-null `!`: Oxlint enforces it (installed `src/components/ui/**` is exempt). A proven exception gets the `SAFETY` / `Verified by` / disable-line block from `docs/effect-lane.md` §2 and is listed in the review packet. Parse unknown input once at its boundary.

## Do not

npm/yarn, Nub as PM, Bun/Deno as baseline, Prisma, Postgres (until trigger), Express, tRPC, Redis, ESLint/Prettier/Biome/Ultracite, Drizzle v1 RC, new Pages projects, day-one Alchemy, day-one monorepo, Effect outside the opt-in Effect lane, Effect in client deliverables.

## Done

For this handbook (from repo root):

```bash
pnpm check && pnpm test
pnpm --dir examples/smoke ship
pnpm --dir examples/astro ship
```

`pnpm check` is read-only. After editing context sources, run `pnpm llms:build` explicitly and review generated changes. Product repos retain `pnpm lint && pnpm typecheck && pnpm test` in their own directory.

Report: files changed, verification run, warnings, not done, whether prod action is still required. In a PR, write the full review packet from `docs/review-guide.md`.
