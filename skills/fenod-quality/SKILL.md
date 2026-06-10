---
name: fenod-quality
description: Fenod's quality gates and verification workflow — TDD with AI, Vitest, Playwright, Ultracite (Oxlint/Oxfmt), tsgo, Husky hooks, and React Doctor. Use this skill whenever writing or fixing tests, setting up linting or formatting, adding git hooks, deciding what to verify before a commit or PR, refactoring existing code, or whenever an agent is about to make code changes in a Fenod repo and needs to know which checks to run and in what order.
---

# Fenod Quality

Fast feedback through one coherent toolchain (VoidZero direction). The rule for agents: run the smallest useful gate first, climb as risk increases, and never push code that hasn't been through the ladder.

## Verification ladder

```bash
pnpm lint        # Ultracite (Oxlint/Oxfmt backend)
pnpm typecheck   # tsgo --noEmit
pnpm test        # Vitest
pnpm build
```

UI changes add:

```bash
pnpm test:e2e    # Playwright
```

React-heavy changes add (when configured):

```bash
pnpm doctor:react:diff   # React Doctor — security, perf, best-practice gate before merge
```

Prefer repo scripts over ad hoc commands. Do not add a new lint/format/test tool without removing or integrating the old path. Do not remove the `typescript` package when tsgo is present; keep both side-by-side until the TypeScript 7/Corsa programmatic API stabilizes and dependent tools migrate.

## TDD with AI — the loop

AI produces plausible code, not guaranteed-correct code. A failing test turns intent into an executable contract and stops broad rewrites.

1. **Red** — write one failing test for the behavior, not the implementation.
2. **Green** — make the smallest change that passes. One step; no cleanup + optimization + rewrite combined.
3. **Verify narrow** — run the targeted test first, widen only if the change crosses layers.
4. **Refactor while green** — simplify names, extract duplication, align with repo patterns.
5. **Next case** — grow by behavior: edge cases, error paths, auth rules, null states, retries.

Where TDD pays off first: services/business rules, routers/loaders/actions, validation/parsing/mappers (all high). Critical UI flows (medium). Pure presentational UI (low — manual review is cheaper). Prompt ladder and full guidance: `src/content/docs/tdd-with-ai.md`.

## Test placement

- Unit/integration: **Vitest**, colocated within the feature slice (`{feature}/service.test.ts` next to `service.ts`). Test the service's public behavior, not Drizzle internals.
- Browser flows and regressions: **Playwright**.
- Follow an existing test file in the repo as the pattern before writing a new style.

## Git hooks

Husky + lint-staged: pre-commit runs lint/format on staged files; the `prepare` script installs hooks automatically after `pnpm install`. Setup pattern: `src/content/docs/code-patterns.md` (Husky section).

## Tooling adoption posture

| Tool | Status |
|------|--------|
| Vite 8, Vitest, Ultracite, tsgo, Playwright | Stable default for new projects |
| `rolldown-vite` | Vite 7 migration bridge before Vite 8, not the new-project default |
| `tsdown` | Default for internal package builds (ESM-first, typed exports, explicit `exports` map) |
| Vite+ | Prototypes only, not client production |

## Dependency security

Product repos use Renovate or Dependabot plus `pnpm audit --audit-level high` in CI. Better Auth, ORPC, and Drizzle are security-sensitive: review quickly, keep patched, and never merge auth/RPC/ORM major upgrades as drive-by cleanup.

## Deep references

Resolve `src/content/docs/<slug>.md` in this order:
1. `../../src/content/docs/<slug>.md` relative to this skill (inside the `fenod-tech-stack` checkout);
2. `~/dev/fenod-tech-stack/src/content/docs/<slug>.md`;
3. `https://raw.githubusercontent.com/tristanremy/fenod-tech-stack/main/src/content/docs/<slug>.md`.

| When you need | Read |
|---------------|------|
| Vitest/Playwright setup, slice testing, React Doctor gates | `TESTING.md` |
| Red/green/refactor with AI, prompt ladder | `TDD-WITH-AI.md` |
| Toolchain defaults and adoption rules | `tooling.md` |
| Wrangler tail, DevTools, logging | `DEBUGGING.md` |
| Perf, security, error handling on existing apps | `APP-IMPROVEMENT-GUIDE.md` |
