---
title: "Radar des Ameliorations Cloudflare"
description: "Fonctionnalites Cloudflare classees par valeur pour effort pour les projets Fenod."
verified: 2026-07
---

Cette page suit les nouveautes Cloudflare qui doivent influencer les defaults Fenod. Le classement mesure la **valeur pour effort**.

## Chemin par Defaut

1. **Workers Cache pour SSR cacheable** — TanStack Start et Astro SSR publics utilisent `Cache-Control` pour eviter d'executer le Worker sur les hits.
2. **Cache tags + purge** — tagger CMS, docs, catalogues et APIs publiques, puis purger via mutations admin ou webhooks.
3. **`stale-while-revalidate` asynchrone** — preferer `public, max-age=300, stale-while-revalidate=3600` pour les pages publiques tolerantes a la fraicheur douce.
4. **Workers Static Assets** — nouveaux sites Astro/Starlight/statiques sur Workers, pas nouveaux projets Pages.
5. **Plugin Cloudflare Vite** — dev local adosse a workerd quand le framework le supporte bien.
6. **Workers Logs + traces automatiques Worker/DO** — debugger les flux distribues avant d'ajouter de l'observabilite tierce.
7. **Metriques memoire Workers/DO** — verifier P90/P99 avant d'optimiser au hasard.
8. **Bulk secrets API / Secrets Store** — automatiser les deploys sans `.env` en clair.
9. **D1 read replication + Sessions API** — pour apps read-heavy avec vraie pression regionale.
10. **Queues sur le Free plan** — petites taches async hors requete.
11. **Rollback Workflows** — paiements, onboarding, imports et effets externes multi-etapes.
12. **Workflows haute concurrence** — fan-out large et boucles agent quand Queues ne suffit plus.
13. **Juridictions Durable Objects** — contraintes de residence explicites.
14. **Durable Object facets** — plateformes multi-tenant/agents avec etat isole par app.
15. **Dynamic Workers** — seulement pour code non fiable ou genere par IA.
16. **Dynamic Workflows** — code charge au runtime qui a besoin d'execution durable.
17. **Containers** — images existantes, binaires natifs, WebSockets longs, CPU/memoire lourds.
18. **Browser Run** — automatisation navigateur hebergee, verification scraping, navigation d'agents.
19. **Agents SDK (`agents`)** — agents Cloudflare-native avec etat, outils, navigateur/code execution et reprise.
20. **AI Gateway comme couche d'inference** — cles, routage, retries, logs et budgets hors code applicatif.
21. **Nouveaux modeles Workers AI** — taches IA edge basse latence; code app agnostique via AI Gateway.
22. **Vectorize list-vectors** — audits, migrations et nettoyage d'index vectoriels.
23. **R2 SQL ameliore** — analytics sur R2/Iceberg avant d'ajouter un warehouse.
24. **Events Cloudflare vers Queues** — reagir sans polling.
25. **Hyperdrive + PlanetScale facture via Cloudflare** — seulement si Postgres/MySQL externe est explicitement choisi; D1 reste default.
26. **Deploys temporaires Wrangler pour agents** — previews/demos; production avec vraie auth et revue.
27. **`wrangler types`** — generer les types Worker. Ne pas maintenir `@cloudflare/workers-types` a la main.
28. **Import `env` depuis `cloudflare:workers`** — seulement quand un binding est necessaire hors handler.
29. **Source maps remappees** — Workers production ou les stack traces comptent.
30. **Workers Cache cross-version cache** — opt-in seulement pour contenu public stable.

## Recette SSR Cache

Pour routes/loaders TanStack Start publics, pages Astro SSR, CMS, docs, catalogues et APIs GET non authentifiees.

```ts
return new Response(html, {
  headers: {
    "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    "Cache-Tag": `posts,post:${post.id}`,
  },
});
```

Purger par tag apres mutation ou webhook:

```ts
await purge({ tags: [`post:${id}`, "posts"] });
```

## Utiliser Autre Chose Quand

- La reponse est specifique utilisateur, privee ou liee a l'auth. Ne pas la mettre en cache public.
- La page est vraiment statique. Astro SSG ou Workers Static Assets est plus simple.
- Le workload est minuscule et ponctuel. Inline avant Queues/Workflows.
- Une fonctionnalite Cloudflare beta deviendrait critique client sans rollback.

## Guides Lies

- [Contrat Stack](/fr/stack-contract/)
- [Vue Stack](/fr/stack-overview/)
- [Calcul Cloudflare](/fr/cloudflare-compute/)
- [Deploiement](/fr/deployment/)
- [Observabilite](/fr/observability/)
