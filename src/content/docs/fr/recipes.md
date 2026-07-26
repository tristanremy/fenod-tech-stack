---
title: "Recettes"
description: "Recettes courtes pour les taches courantes de la stack Fenod."
verified: 2026-06
---

Les recettes implementent le [Contrat de Stack](/fr/stack-contract/). Rester court. Loi EN: [/stack-contract/](/stack-contract/).

## Demarrer une app full-stack

Voir page EN [/recipes/](/recipes/) et la reference vivante `examples/smoke` (D1, Wrangler, Ultracite). Un package. Pas de monorepo day-one.

## Ajouter une feature API

```txt
{api}/routers/{feature}/
├── index.ts
├── router.ts
└── service.ts
```

## Auth / AI / uploads / email / analytics / offline / deploy

Meme substance que la page EN [/recipes/](/recipes/): Better Auth+D1; TanStack AI+AI Gateway; R2+D1; email split CF/Resend; Query persist par defaut; Wrangler deploy; handbook `pnpm build`.
