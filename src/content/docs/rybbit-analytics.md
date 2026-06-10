---
title: "Rybbit analytics (first-party proxy)"
verified: 2026-06
---

Privacy-friendly analytics via a **first-party** `/analytics/*` path proxied to your Rybbit instance (Fenod default: `https://a.fno.ovh`).

Official: [Cloudflare Workers proxy](https://rybbit.com/docs/proxy-guide/cloudflare-workers)

## Fenod stack recommendation

| App type | Approach |
|----------|----------|
| **TanStack Start on Cloudflare Workers** | **Standalone Worker** + zone route `yourdomain.com/analytics/*` — do not modify `@tanstack/react-start/server-entry` |
| **Astro static on Cloudflare Pages** | Pages Function — see agent guide below |
| **Worker serving `dist/` assets** | Same Worker + `run_worker_first` for `/analytics/*` |

Add to your HTML shell:

```html
<script src="/analytics/script.js" async data-site-id="YOUR_SITE_ID"></script>
```

- Site ID: Rybbit dashboard → inject at build (`PUBLIC_RYBBIT_SITE_ID`) via Infisical / CI
- `RYBBIT_HOST`: non-secret Worker `var` on the **proxy** worker (not necessarily on the app worker)

## Implementation references

Keep reusable templates in each project or in a public template package. Avoid linking to private sibling checkouts from public docs.

| Guide | Contents |
|-------|----------|
| Cloudflare Workers proxy | Pattern A/B/C, zone routes, Fenod TanStack Start, caching |
| Astro + Pages Functions proxy | Static Astro, Vite dev proxy, Pages Function |
| Worker template | Copy-paste standalone Worker for `/analytics/*` |

## Quick deploy (standalone Worker)

```bash
# From a project that copied the templates
wrangler deploy
# Dashboard → Triggers → Route: yourdomain.com/analytics/*
```

Forward visitor IP using `CF-Connecting-IP` (included in the template).

## Related stack docs

- [Cloudflare Compute](/cloudflare-compute/) — Worker primitives
- [Deployment](/deployment/) — Alchemy / Wrangler
- [Environment and Secrets](/environment-secrets/) — Infisical + Worker vars
- [Astro SEO Guide](/astro-seo-guide/) — layout / metadata patterns
