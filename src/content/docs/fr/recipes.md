---
title: "Recettes"
description: "Recettes d'implementation canoniques pour les taches courantes de la stack Fenod."
verified: 2026-06
---

## Demarrer une App Full-Stack

Utiliser TanStack Start avec add-ons, puis ajouter Hono manuellement si l'app a besoin d'une couche API dediee.

```bash
pnpm create @tanstack/start@latest my-app \
  --add-ons oRPC,drizzle,better-auth,shadcn,tanstack-query,cloudflare
```

## Ajouter une Feature API

Creer une feature slice:

```txt
packages/api/src/routers/{feature}/
├── index.ts
├── router.ts
└── service.ts
```

Garder `router.ts` fin. Mettre la logique metier et les appels Drizzle dans `service.ts`.

## Ajouter l'Auth

Utiliser Better Auth avec D1. Garder la config auth cote serveur et valider l'etat de session aux frontieres API.

## Ajouter un Chat IA

Utiliser:

- TanStack AI pour chat/tool/streaming state
- `@cloudflare/tanstack-ai` pour Workers AI / AI Gateway
- cles fournisseur stockees Cloudflare AI Gateway en production

Ne pas exposer de cles fournisseur au navigateur.

## Ajouter des Uploads Fichier

Utiliser R2 pour le stockage objet et D1 pour les metadonnees. Garder l'autorisation d'upload cote serveur.

## Ajouter l'Email

Entrant:

```txt
Cloudflare Email Routing → Email Worker → Queue/D1/R2
```

Sortant transactionnel:

```txt
Politique app cote serveur → Queue → Resend/Postmark
```

Marketing:

```txt
Plateforme lifecycle email
```

## Ajouter l'Analytics

Utiliser un proxy first-party pour l'analytics privacy-friendly quand possible. Stocker les site IDs publics comme config publique et les hosts fournisseur comme vars non secretes.

## Ajouter le Support Offline

N'implementer le full offline-first que si les utilisateurs travaillent en zones blanches ou reseaux instables. Sinon, le cache TanStack Query suffit souvent.

## Deployer les Docs

Ce repo est un site Starlight.

```bash
pnpm build
```

Cloudflare Pages:

```txt
Build command: pnpm build
Output directory: dist
Production branch: main
Custom domain: stack.fenod.fr
```

## Ajouter un Diagramme

1. Ajouter la source Mermaid dans `src/diagrams/name.mmd`.
2. Lancer `pnpm diagrams:build`.
3. Integrer avec:

```md
![Titre du diagramme](/diagrams/name.svg)
```
