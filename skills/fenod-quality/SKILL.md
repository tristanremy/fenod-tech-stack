---
name: fenod-quality
description: Fenod's quality gates and verification workflow — TDD with AI, Vitest, Playwright, Oxlint, @shadcn/lint, Oxfmt, TypeScript 7, and optional React Doctor. Use this skill whenever writing or fixing tests, setting up linting or formatting, deciding what to verify before a commit or PR, refactoring existing code, or whenever an agent is about to make code changes in a Fenod repo and needs to know which checks to run and in what order.
---

# Fenod Quality

**Stack Contract is law.** Fast feedback, smallest useful gate first.

## Ship gate (default done bar)

```bash
pnpm lint        # oxlint .
pnpm typecheck   # stable TypeScript 7 tsc; respect documented tooling exceptions
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
| **@shadcn/lint** | Oxlint JS plugin for Tailwind design systems; start with `no-restyle`, layout allowed. See `docs/recipes.md`. |

Do not add ESLint, Prettier, Biome, Ultracite, Babel, or `oxc-transform-react` beside this.
Do not add `useMemo` / `useCallback` / `memo` unless measured or required for identity.  
Use stable TypeScript 7 for typechecks. Keep the TypeScript 6 compatibility API only for tools that require it (including parser/framework tooling); validate before removing it. Smoke has a documented pending migration from native-preview, not a second default.

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
| Node 24, pnpm, Vite 8, Vitest 5, Oxlint, Oxfmt, TypeScript 7, Playwright | default |
| `rolldown-vite` | Vite 7 bridge only |
| `tsdown` | internal package builds |
| React Doctor / husky | optional repo choices, not universal law |
| Vite+ | prototypes only |

## Dependency security

Renovate or Dependabot + `pnpm audit --audit-level high` in product repos. Pin CI actions to full commit SHAs, run dependency review and a secret scan. Better Auth, ORPC, Drizzle: patch fast; majors need explicit review.

## Deep references

Paths below are relative to the handbook root.

| Need | Read |
|------|------|
| Law / toolchain | `docs/stack-contract.md` |
| Verification scripts | `examples/smoke/package.json`, `examples/astro/package.json` |
| D1 and performance tests | `docs/recipes.md` |
| Agent evaluations | `docs/agent-evals.md` |
