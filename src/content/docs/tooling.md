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
| Runtime | Node 24 | Baseline for app and CI commands |
| Package manager | pnpm | Default for workspaces and scripts |
| Dev/build foundation | Vite | Via TanStack Start, Astro, or direct Vite apps |
| Test runner | Vitest | Unit/integration tests with Vite-aware config |
| Browser tests | Playwright | User flows, regression checks, screenshots when needed |
| Lint/format | Ultracite + Oxlint/Oxfmt | Prefer one repo-level command over bespoke ESLint/Prettier stacks |
| Type checking | tsgo | Fast TypeScript checking where supported |
| Package builds | tsdown | Default for internal libraries/packages |
| Monorepo orchestration | Turborepo | Only when repo shape needs it |

## VoidZero Direction

VoidZero tooling is now part of Cloudflare's platform strategy after Cloudflare acquired VoidZero in June 2026. This validates the Fenod default of Cloudflare-first runtime plus Vite/Vitest/Oxc/Rolldown tooling, but it also creates a deliberate concentration risk: the stack leans heavily on one vendor ecosystem.

- **Vite 8** for dev/build foundation in new projects
- **Vitest** for tests
- **Oxlint/Oxfmt** for fast lint/format foundations
- **Rolldown** as the Vite 8 default bundler
- **tsdown** for package/library builds
- **Vite+** as an experimental unified entry point for prototypes

Adoption posture:

| Tool | Use now | Try when | Avoid when |
|------|---------|----------|------------|
| Vite 8 | yes for new projects | default | existing Vite 7 app needs a lower-risk two-step migration |
| `rolldown-vite` | migration bridge | existing Vite 7 app wants to isolate bundler issues before Vite 8 | new projects; use Vite 8 directly |
| Vitest | yes | default | true browser-only behavior is required; use Playwright |
| Ultracite | yes | default lint/format gate | repo has a strong existing standard to preserve |
| tsdown | yes for packages | replacing tsup/Rollup configs | app builds handled by framework |
| Vite+ | experimental | prototypes and internal tests | production client baseline until stable enough |

### tsgo and TypeScript 7

tsgo is the native TypeScript 7 / Corsa toolchain and is the fast path for type-check scripts and CI gates. It does not fully replace the existing JavaScript TypeScript / Strada toolchain for every use case.

Keep `typescript` installed side-by-side for tools that consume the TypeScript programmatic API, such as codemods, editor integrations, framework checkers, and some lint plugins. Removing `typescript` just because `tsgo` is present is not a cleanup until the Corsa API stabilizes and the relevant tools migrate.

Current install posture: keep `typescript` for API consumers and use tsgo/native preview only through explicit scripts such as `pnpm typecheck`.

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
- Do not remove the `typescript` package when tsgo is present; keep both side-by-side until the Corsa API stabilizes and the project confirms dependent tools have migrated.
- If a package build needs custom config, explain the concrete limitation that tsdown cannot cover.

## Related Guides

- [Stack Overview](/stack-overview/)
- [Testing Guide](/testing/)
- [AI Development Workflow](/ai-development-workflow/)
- [Local Toolchain Snapshot](/local-toolchain/)
