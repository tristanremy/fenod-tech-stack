---
title: "Tooling"
verified: 2026-06
---

[Disponible en francais](/fr/tooling/)

JavaScript/TypeScript tooling defaults. **[Stack Contract](/stack-contract/) is law.**

## Default stack

![VoidZero tooling pipeline](/diagrams/voidzero-tooling-pipeline.svg)

| Layer | Default | Notes |
|-------|---------|-------|
| Runtime | Node 24 | App and CI baseline |
| Package manager | pnpm | Workspaces and scripts |
| Dev/build | Vite 8 + Rolldown | TanStack Start, Astro, or plain Vite |
| Lint | **Oxlint** | Fast lint; no ESLint-by-default |
| Format | **Oxfmt** | Fast format; no Prettier-by-default |
| Lint/format scripts | `oxlint` / `oxfmt` | No ESLint, Prettier, Biome, or Ultracite wrapper |
| Types | tsgo | Keep `typescript` installed for tooling APIs |
| Unit/integration | Vitest | Vite-aware |
| Browser | Playwright | Real UI flows |
| Package builds | tsdown | Internal libraries only |
| Monorepo orchestration | Turborepo | Only when repo shape needs it |

## VoidZero direction

Cloudflare’s VoidZero acquisition aligns runtime + tooling, and concentrates vendor risk. Fenod accepts that for delivery speed. Keep portable boundaries.

| Tool | Use now | Avoid when |
|------|---------|------------|
| Vite 8 | new projects | — |
| `rolldown-vite` | Vite 7 migration bridge | new projects |
| Oxlint + Oxfmt | always | adding ESLint/Prettier “for completeness” |
| Oxlint + Oxfmt scripts | default repo command | adding ESLint/Prettier/Biome/Ultracite beside them |
| Vitest | default | browser-only behavior → Playwright |
| tsdown | internal packages | app builds owned by the framework |
| Vite+ | prototypes | production client baseline |

### tsgo and TypeScript 7

tsgo is the fast typecheck path. It does not fully replace the `typescript` package for programmatic API consumers (codemods, some plugins, editor/framework checkers). Keep both until those tools move.

## Verification ladder

Ship gate:

```bash
pnpm lint        # oxlint .
pnpm format:check
pnpm typecheck   # tsgo --noEmit
pnpm test        # Vitest
```

Higher risk / merge:

```bash
pnpm build
pnpm test:e2e    # when UI flows matter
```

Optional when configured: React Doctor on UI-heavy PRs. Not universal law on every edit.

## Agent notes

- Prefer repo scripts over raw binary invocations.
- Do not add a second lint/format stack beside Oxlint/Oxfmt.
- Do not remove `typescript` because tsgo exists.
- Bun/Deno may be installed locally; they are not required baselines.

## Related guides

- [Stack Contract](/stack-contract/)
- [Testing](/testing/)
- [TDD with AI](/tdd-with-ai/)
