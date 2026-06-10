---
title: "Tooling"
verified: 2026-06
---

[Disponible en francais](/tooling/)

This guide defines the JavaScript/TypeScript tooling direction for Fenod projects. The goal is fast feedback, minimal config, and one coherent path agents can follow.

## Default Stack

![VoidZero tooling pipeline](/diagrams/voidzero-tooling-pipeline.svg)

| Layer | Default | Notes |
|-------|---------|-------|
| Runtime | Node 22 | Baseline for app and CI commands |
| Package manager | pnpm | Default for workspaces and scripts |
| Dev/build foundation | Vite | Via TanStack Start, Astro, or direct Vite apps |
| Test runner | Vitest | Unit/integration tests with Vite-aware config |
| Browser tests | Playwright | User flows, regression checks, screenshots when needed |
| Lint/format | Ultracite + Oxlint/Oxfmt | Prefer one repo-level command over bespoke ESLint/Prettier stacks |
| Type checking | tsgo | Fast TypeScript checking where supported |
| Package builds | tsdown | Default for internal libraries/packages |
| Monorepo orchestration | Turborepo | Only when repo shape needs it |

## VoidZero Direction

VoidZero tooling is the direction for the JS toolchain:

- **Vite** for dev/build foundation
- **Vitest** for tests
- **Oxlint/Oxfmt** for fast lint/format foundations
- **Rolldown** for faster bundled builds as it matures
- **tsdown** for package/library builds
- **Vite+** as an experimental unified entry point for prototypes

Adoption posture:

| Tool | Use now | Try when | Avoid when |
|------|---------|----------|------------|
| Vite | yes | default | framework hides it completely and no config needed |
| Vitest | yes | default | true browser-only behavior is required; use Playwright |
| Ultracite | yes | default lint/format gate | repo has a strong existing standard to preserve |
| Rolldown / `rolldown-vite` | selectively | build time is painful or app is large | client work cannot tolerate bundler edge cases |
| tsdown | yes for packages | replacing tsup/Rollup configs | app builds handled by framework |
| Vite+ | experimental | prototypes and internal tests | production client baseline until stable enough |

## Package Build Defaults

For internal packages:

- ESM-first output
- typed exports
- explicit `exports` map
- no custom Rollup unless a concrete plugin need exists
- smoke-test package imports before publishing/releasing

Example package scripts:

```json
{
  "scripts": {
    "build": "tsdown",
    "typecheck": "tsgo --noEmit",
    "test": "vitest run"
  }
}
```

## Verification Ladder

Agents and humans should run the smallest useful gate first, then climb as risk increases.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For UI changes:

```bash
pnpm test:e2e
```

For React-heavy changes, include React Doctor when configured:

```bash
pnpm doctor:react:diff
```

## Tooling Rules for Agents

- Prefer repo scripts over ad hoc commands.
- Do not add new lint/format/test tools without removing or integrating the old path.
- Do not switch package managers.
- Do not make Bun/Deno required for normal app commands unless the project explicitly chooses them.
- If build performance is a problem, try Rolldown as an experiment and document results before standardizing it.
- If a package build needs custom config, explain the concrete limitation that tsdown cannot cover.

## Related Guides

- [Stack Overview](/stack-overview/)
- [Testing Guide](/testing/)
- [AI Development Workflow](/ai-development-workflow/)
- [Local Toolchain Snapshot](/local-toolchain/)
