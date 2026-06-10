---
title: "Contrat de Stack"
description: "Defaults canoniques de la stack Fenod pour humains et agents IA."
verified: 2026-06
---

Cette page est le contrat. Si une autre page est plus detaillee, utilise cette page pour resoudre les defaults.

## Regles de Documentation

- Le [Fenod Stack Handbook](./) est la surface de documentation canonique.
- L'anglais est la Source Locale sauf indication contraire explicite.
- Les guides majeurs doivent suivre la Guide Shape: Default Path, Gotchas, Agent Notes et Related Guides.
- Les recettes doivent etre des Implementation Recipes: outils exacts, chemins de fichiers, commandes, pieges et verification.
- Les diagrammes doivent etre des Decision Diagrams: utiles pour frontieres, flux, cycles de vie et cartes de decision.

## Utiliser

- Node 24 pour les nouveaux projets; Node 22 seulement pour l'existant jusqu'a migration
- pnpm
- TanStack Start pour les apps full-stack
- Astro/Starlight pour les docs et sites riches en contenu
- Hono + ORPC pour les APIs
- Drizzle 0.44.x stable + D1 pour les donnees relationnelles; ne pas upgrader le travail client vers Drizzle v1 RC pour l'instant
- Better Auth latest 1.6.x pour l'authentification
- Tailwind v4 + shadcn/ui pour les fondations UI
- TanStack Query/Router/Form/Table quand pertinent
- TanStack AI pour chat, tools, streaming et etat agent
- Cloudflare AI Gateway pour routing fournisseurs, budgets et cles stockees
- Cloudflare Workers comme runtime par defaut pour les nouvelles apps et sites dynamiques
- Cloudflare Workers Static Assets pour les nouveaux sites statiques/docs/contenu quand on demarre de zero
- Cloudflare Pages seulement pour les projets docs/statiques existants connectes a GitHub ou cette integration reste le chemin le plus simple
- R2 pour les fichiers
- KV pour config/cache, pas pour donnees relationnelles
- Queues/Workflows pour les jobs async
- Durable Objects pour la coordination stateful
- Wrangler pour les deploiements par defaut; Alchemy v2 seulement pour les projets multi-ressources/multi-stages (voir [Deployment](/fr/deployment/))
- Infisical ou Bitwarden Secrets Manager pour les secrets
- Vite 8 + Rolldown pour les nouveaux projets; `rolldown-vite` seulement comme pont de migration Vite 7
- Ultracite + tsgo + Vitest + Playwright pour les quality gates
- tsdown pour les packages internes

## Ne Pas Utiliser par Defaut

- npm/yarn au lieu de pnpm
- Prisma au lieu de Drizzle
- Postgres sauf demande explicite
- Express quand Hono suffit
- tRPC quand ORPC est le choix de stack
- ceremonie Clean/hexagonal architecture pour petites apps
- interfaces repository autour de Drizzle sans vraie douleur
- Global API Key Cloudflare
- tokens de deploiement larges au niveau compte
- fichiers `.env` plaintext dans Git
- cles fournisseur dans le code client
- upgrades majeurs non relus des packages auth/RPC/ORM
- Drizzle v1 RC sur projets clients avant un plan de migration stable
- Vercel AI SDK pour nouveau code app sauf workflow non supporte

## Regle Architecture

Utiliser des feature slices:

```txt
packages/api/src/routers/{feature}/
├── index.ts
├── router.ts
└── service.ts
```

Les routers valident et exposent les contrats. Les services contiennent la logique metier et appellent Drizzle directement.

## Regle Verification

Avant de dire que le travail est termine, lancer la plus petite echelle pertinente:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Pour les changements UI, verifier dans un navigateur. Pour les changements production, exiger approbation explicite et auditabilite.
