---
title: "Pieges"
description: "Pieges a fort signal dans la stack Fenod."
verified: 2026-06
---

## Override de Token Wrangler

Si `CLOUDFLARE_API_TOKEN` est exporte localement, Wrangler peut l'utiliser au lieu d'OAuth et echouer avec des erreurs de permissions confuses.

Utiliser:

```bash
env -u CLOUDFLARE_API_TOKEN wrangler ...
```

## Scope des Tokens Cloudflare

Ne jamais utiliser la Global API Key. Preferer un token scope ressource par job:

- deploy Worker
- deploy Pages
- migration D1
- upload R2
- edition DNS
- lecture logs/analytics

## D1 Est SQLite

D1 est compatible SQLite. Ne pas supposer les features, extensions ou comportements de migration Postgres.

## KV N'est Pas une Base de Donnees

KV est eventual consistent et meilleur pour config/cache. Ne pas l'utiliser pour des donnees relationnelles ou transactionnelles.

## R2 Est du Stockage Objet

R2 sert aux fichiers et blobs. Stocker les metadonnees dans D1 quand il faut requeter, gerer l'ownership ou suivre un cycle de vie.

## Secrets Better Auth

`BETTER_AUTH_SECRET` doit etre reel, long et server-only. Les placeholders ne sont acceptables que dans `.env.example`.

## TanStack Start et Cloudflare

Verifier la compatibilite runtime avant d'ajouter des packages Node-only. Cloudflare Workers ne fournit pas un environnement serveur Node complet.

## Cles Fournisseur AI Gateway

Pour les apps IA en production, preferer les cles stockees/BYOK d'AI Gateway. Les cles fournisseur directes dans les secrets Worker sont des exceptions.

## Split Email

- Entrant: Cloudflare Email Routing / Email Workers
- Sortant transactionnel: Resend ou Postmark
- Marketing: Loops, Customer.io ou equivalent

Ne pas laisser les agents envoyer directement des emails arbitraires.

## Docs Francaises

Les pages francaises doivent preserver les slugs et identifiants de code. Traduire la prose, pas les noms de packages, commandes, noms d'API ou contrats de code.

## Diagrammes

La source Mermaid vit dans `src/diagrams/*.mmd`. Les SVG generes vivent dans `public/diagrams/*.svg` et sont crees par:

```bash
pnpm diagrams:build
```

## Alchemy v1 vs v2

Le package npm est `alchemy`, pas l'ancien package framework Alchemy. Alchemy v2 est une reecriture basee sur Effect avec `Alchemy.Stack(...)` et `Cloudflare.Worker(...)`; les exemples v1 venant d'anciennes docs ou de vieux articles ne fonctionnent pas avec v2.

## Redis n'Appartient pas au Default Stack

Utiliser les primitives Cloudflare-native: KV pour le cache, le binding Workers rate limiting pour les limites simples, et Durable Objects pour les quotas custom. Ne pas ajouter Redis externe pour le rate limiting par defaut.

## tsgo ne Remplace pas le Package typescript

tsgo utilise la toolchain native TypeScript 7/Corsa pour des type checks rapides. Garder `typescript` installe side-by-side pour les outils qui consomment l'API programmatique legacy Strada jusqu'a stabilisation de l'API Corsa.
