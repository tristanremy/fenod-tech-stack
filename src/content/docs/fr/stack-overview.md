---
title: "Vue d'ensemble de la stack"
verified: 2026-06
---

Vue operationnelle. **[Contrat de Stack](/fr/stack-contract/) est la loi** (source EN: [/stack-contract/](/stack-contract/)).

## Ce que la stack optimise

- Produit type avec peu de ceremonie
- Ship rapide vers l'edge
- Un chemin par defaut partage humains/agents
- Primitives Cloudflare-native
- Contraintes fortes pour le dev assiste par IA

## Chemin par defaut

![Architecture TanStack Start](/diagrams/tanstack-start-architecture-fr.svg)

| Couche | Defaut | Pourquoi |
|--------|--------|----------|
| Runtime | Node 24 + pnpm | Baseline stable |
| App | TanStack Start sur Workers | React full-stack type a l'edge |
| Contenu | Astro / Starlight | SEO/contenu sans ceremonie app |
| API | Server functions → Hono + ORPC si besoin | Pas de taxe API day-one |
| Data | Drizzle 0.4x + D1 | SQL simple aligne Workers |
| Auth | Better Auth | TS-first, D1-friendly |
| UI | Tailwind v4 + shadcn/ui | UI produit rapide |
| AI | TanStack AI + AI Gateway | Etat app + cles routees |
| Deploy | Workers | 1 Worker: Git-connect / Wrangler. 2+ Workers partages: Alchemy |
| Secrets | Infisical + secrets Worker | Pas d'env plaintext dans git |
| Lint/format | Oxlint + Oxfmt | Chemin VoidZero rapide |
| Types/tests | tsgo, Vitest, Playwright | Check rapide + comportement reel |

Day-one = **un package app**. Monorepo, Alchemy, Postgres, offline complet = triggers (contrat).

## Installe ≠ primaire

`node` + `pnpm` = baseline. Bun/Deno optionnels. Python/Rust = support. Choix d'editeur = personnel, pas loi de stack.

## Direction VoidZero

Vite 8, Vitest, Oxlint/Oxfmt, Rolldown, tsdown. Concentration vendeur acceptee pour la vitesse Fenod; garder des frontieres portables (SQL, HTTP, TypeScript).

## Related

- [Contrat de Stack](/fr/stack-contract/)
- [Index IA](/fr/ai-index/)
- [Outillage](/fr/tooling/)
- [Deploiement](/fr/deployment/)
