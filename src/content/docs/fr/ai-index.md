---
title: "Index IA"
description: "Point d'entree rapide pour les agents IA sur la stack Fenod."
verified: 2026-06
---

Si tu es un agent IA dans un projet Fenod, lis ceci d'abord. Minimum de contexte, puis travail.

Loi canonique en anglais: [Stack Contract](/stack-contract/).

## A lire en premier

1. [Contrat de Stack](/fr/stack-contract/) — **loi** (EN fait foi)
2. [Contrat operationnel agent](/fr/agent-operating-contract/)
3. [Pieges](/fr/gotchas/)
4. [Recettes](/fr/recipes/)
5. [Modele de securite](/fr/security-model/)

## Loi en une phrase

> Node 24 + pnpm. TanStack Start + Workers. Drizzle/D1 + Better Auth. Tailwind v4 + shadcn. Wrangler. Oxlint + Oxfmt. Infisical + secrets Worker. Hono/ORPC seulement si frontiere API. Plus petite gate. Pas de secrets dans git, pas d'autorite prod, pas de thrash de stack.

## Defaults rapides

| Zone | Defaut |
|------|--------|
| Runtime | Node 24 + pnpm |
| App | TanStack Start sur Cloudflare Workers |
| Contenu/docs | Astro / Starlight sur Workers static assets |
| API | Server functions Start d'abord; Hono + ORPC si besoin |
| Base | Drizzle 0.4x + D1 |
| Auth | Better Auth |
| UI | Tailwind v4 + shadcn/ui |
| IA | TanStack AI + AI Gateway |
| Deploy | Wrangler |
| Secrets | Infisical + secrets Worker |
| Lint/format | Oxlint + Oxfmt |
| Types | tsgo (+ `typescript`) |
| Tests | Vitest; Playwright pour UI |

## Forme

- Day-one: **un package app**, pas un monorepo.
- Pas d'hexagonal / repository theater autour de Drizzle.
- Alchemy, Postgres, offline complet, Pages: **triggers seulement**.

## Regle simple

```bash
pnpm lint && pnpm typecheck && pnpm test
```
