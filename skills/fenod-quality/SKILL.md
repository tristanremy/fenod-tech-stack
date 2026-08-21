---
name: fenod-quality
description: Fenod's quality gates and verification workflow — TDD with AI, Vitest, Playwright, Oxlint, Oxfmt, tsgo, and optional React Doctor. Use this skill whenever writing or fixing tests, setting up linting or formatting, deciding what to verify before a commit or PR, refactoring existing code, or whenever an agent is about to make code changes in a Fenod repo and needs to know which checks to run and in what order.
---

# Fenod Quality

**Stack Contract is law.** Fast feedback, smallest useful gate first.

## Ship gate (default done bar)

```bash
pnpm lint        # oxlint .
pnpm typecheck   # tsgo --noEmit
pnpm test        # Vitest
```

## Higher-risk / merge gate

```bash
pnpm build
pnpm test:e2e            # UI flows (Playwright)
# browser check for visual changes
pnpm doctor:react:diff   # optional, only if repo configures React Doctor
```

Do not run the entire optional toolbox on every one-line fix. Prefer repo scripts over ad hoc binaries.

## Lint / format law

| Tool | Role |
|------|------|
| **Oxlint** | lint — React plugin + `correctness` (React Compiler rules). Never `react/react-compiler`. |
| **Oxfmt** | format |

Do not add ESLint, Prettier, Biome, Ultracite, Babel, or `oxc-transform-react` beside this.
Do not add `useMemo` / `useCallback` / `memo` unless measured or required for identity.  
Do not remove the `typescript` package because tsgo exists — keep both until tooling APIs catch up.

## TDD with AI

AI output is plausible, not proven. Prefer:

1. **Red** — one failing test for behavior
2. **Green** — smallest pass
3. **Narrow verify** — targeted test first
4. **Refactor** while green
5. Next behavior

High value: services, routers/actions, validation/mappers, auth rules.  
Low value: pure presentational UI (manual/browser often cheaper).

## Tests

- **Vitest** unit/integration, prefer colocated with the feature
- **Playwright** real browser flows
- Copy an existing test file’s style before inventing a new one

## Tooling posture

| Tool | Status |
|------|--------|
| Node 24, pnpm, Vite 8, Vitest, Oxlint, Oxfmt, tsgo, Playwright | default |
| `rolldown-vite` | Vite 7 bridge only |
| `tsdown` | internal package builds |
| React Doctor / husky | optional repo choices, not universal law |
| Vite+ | prototypes only |

## Dependency security

Renovate or Dependabot + `pnpm audit --audit-level high` in product repos. Pin CI actions to full commit SHAs, run dependency review and a secret scan. Better Auth, ORPC, Drizzle: patch fast; majors need explicit review.

## Deep references

| Need | Read |
|------|------|
| Law | `stack-contract.md` |
| Toolchain | `tooling.md` |
| TDD detail | `tdd-with-ai.md` |
| Test setup depth | `testing.md` |
