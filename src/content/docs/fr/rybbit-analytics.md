---
title: "Rybbit Analytics (proxy first-party)"
description: "Analytics privacy-friendly avec un proxy first-party vers Rybbit."
verified: 2026-06
---

Analytics respectueux de la vie privee via un chemin **first-party** `/analytics/*` proxifie vers ton instance Rybbit (default Fenod: `https://a.fno.ovh`).

Reference officielle: [proxy Cloudflare Workers](https://rybbit.com/docs/proxy-guide/cloudflare-workers)

## Recommandation Fenod Stack

| Type d'app | Approche |
|------------|----------|
| **TanStack Start sur Cloudflare Workers** | **Worker standalone** + route de zone `yourdomain.com/analytics/*` — ne pas modifier `@tanstack/react-start/server-entry` |
| **Astro statique sur Cloudflare Pages** | Pages Function |
| **Worker servant les assets `dist/`** | Meme Worker + `run_worker_first` pour `/analytics/*` |

Ajouter au shell HTML:

```html
<script src="/analytics/script.js" async data-site-id="YOUR_SITE_ID"></script>
```

- Site ID: dashboard Rybbit → injecter au build (`PUBLIC_RYBBIT_SITE_ID`) via Infisical / CI
- `RYBBIT_HOST`: `var` Worker non secrete sur le Worker proxy, pas forcement sur le Worker applicatif

## References d'Implementation

Garder les templates reutilisables dans chaque projet ou dans un package template public. Eviter les liens vers des checkouts prives depuis les docs publiques.

| Guide | Contenu |
|-------|---------|
| Proxy Cloudflare Workers | Pattern A/B/C, routes de zone, Fenod TanStack Start, caching |
| Proxy Astro + Pages Functions | Astro statique, proxy Vite dev, Pages Function |
| Template Worker | Worker standalone copy-paste pour `/analytics/*` |

## Deploiement Rapide (Worker Standalone)

```bash
# Depuis un projet qui a copie les templates
wrangler deploy
# Dashboard → Triggers → Route: yourdomain.com/analytics/*
```

Forwarder l'IP visiteur via `CF-Connecting-IP` (inclus dans le template).

## Docs Liees

- [Cloudflare Compute](/fr/cloudflare-compute/) — primitives Worker
- [Deployment](/fr/deployment/) — Alchemy / Wrangler
- [Environment and Secrets](/fr/environment-secrets/) — Infisical + Worker vars
- [Astro SEO Guide](/fr/astro-seo-guide/) — patterns layout / metadata
