---
title: "Outillage"
verified: 2026-06
---

Defaults JS/TS. **[Contrat de Stack](/fr/stack-contract/) est la loi.**

## Stack par defaut

| Couche | Defaut |
|--------|--------|
| Runtime | Node 24 |
| Package manager | pnpm |
| Dev/build | Vite 8 + Rolldown |
| Lint | **Oxlint** |
| Format | **Oxfmt** |
| Scripts lint/format | `oxlint` / `oxfmt` |
| Types | tsgo (+ garder `typescript`) |
| Tests | Vitest; Playwright pour UI |
| Packages internes | tsdown |
| Monorepo | Turborepo seulement si besoin |

Pas d'ESLint/Prettier par defaut a cote d'Oxlint/Oxfmt.

## Ship gate

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Risque plus haut: `pnpm build`, `pnpm test:e2e`.

## Related

- [Contrat de Stack](/fr/stack-contract/)
- [Version EN](/tooling/)
