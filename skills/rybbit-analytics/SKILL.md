---
name: rybbit-analytics
description: >-
  Adds Rybbit privacy-friendly analytics with a first-party /analytics/* proxy
  to bypass ad blockers. Use when adding analytics, Rybbit, tracking scripts,
  Cloudflare Pages Functions, Cloudflare Workers zone routes, Astro sites, or
  Fenod TanStack Start apps on Cloudflare.
---

# Rybbit analytics (Fenod / web)

First-party proxy: browser calls `/analytics/*` on the site origin → upstream `{RYBBIT_HOST}/api/*`.

**Default Fenod instance:** `https://a.fno.ovh` (cloud: `https://app.rybbit.io`)

**Reference deployment (this repo):** prod **`https://audrain-patrimoine.fr`** — Cloudflare Pages project `ra-consulting`, Rybbit site ID `3`.

**Script tag (always first-party, never third-party `a.fno.ovh` in HTML):**

```html
<script src="/analytics/script.js" data-site-id="SITE_ID" defer></script>
```

## Gather from user

- Production URL (e.g. `https://audrain-patrimoine.fr`)
- `RYBBIT_HOST` (default `https://a.fno.ovh`)
- `SITE_ID` from Rybbit dashboard → `PUBLIC_RYBBIT_SITE_ID` at build time
- Deploy target (see decision tree)

## Decision tree

| Deploy | Implementation |
|--------|----------------|
| **Astro static + Cloudflare Pages** (`wrangler pages deploy dist`) | Pages Function + Vite dev proxy — [templates/pages-function.ts](templates/pages-function.ts) |
| **TanStack Start / app on Workers** (Fenod stack) | **Standalone Worker + zone route** `domain.com/analytics/*` — do not patch `server-entry` — [templates/rybbit-worker.ts](templates/rybbit-worker.ts) |
| **Single Worker + static assets** (`ASSETS` binding) | `run_worker_first` + proxy in main `fetch` — see [reference.md](reference.md) |
| **Astro SSR** (`output: server` + adapter) | `src/middleware.ts` importing [templates/rybbit-proxy.ts](templates/rybbit-proxy.ts) |

## Implementation checklist

1. Copy `templates/rybbit-proxy.ts` → `lib/rybbit-proxy.ts`
2. Apply deploy-pattern template (Pages Function, Worker, or middleware)
3. Add script tag to root layout / `index.html` `<head>`
4. Add `.env.example`: `PUBLIC_RYBBIT_SITE_ID`, `RYBBIT_HOST`
5. Set `RYBBIT_HOST` in `wrangler.toml` `[vars]` when using Cloudflare
6. **Never** commit `.env`
7. **Astro:** use static `defineConfig({ … })` for Vite proxy — not `defineConfig(({ mode }) => …)` (breaks `inlineStylesheets` / Tailwind)
8. Verify: `GET /analytics/script.js` 200, `POST /analytics/track` 2xx, dashboard shows data; after build, HTML includes styles (no empty `/_astro/*.css` utilities)

## IP forwarding (Cloudflare)

Set `X-Real-IP` and `X-Forwarded-For` from `CF-Connecting-IP` (included in `rybbit-proxy.ts`).

## Path mapping

```
/analytics/script.js  →  {RYBBIT_HOST}/api/script.js
/analytics/track      →  {RYBBIT_HOST}/api/track
/analytics/*          →  {RYBBIT_HOST}/api/*
```

## Astro + Pages (minimal)

**`functions/analytics/[[path]].ts`** — use [templates/pages-function.ts](templates/pages-function.ts)

**`astro.config.mjs`** — Vite proxy snippet in [reference.md](reference.md)

**`src/layouts/Layout.astro`:**

```astro
const rybbitSiteId = import.meta.env.PUBLIC_RYBBIT_SITE_ID ?? 'SITE_ID';
---
<script src="/analytics/script.js" data-site-id={rybbitSiteId} defer></script>
```

Deploy from **repo root** so `functions/` is bundled with `dist/`.

## Fenod TanStack Start

Use standalone Worker ([templates/rybbit-worker.ts](templates/rybbit-worker.ts) + [templates/wrangler.rybbit-worker.jsonc](templates/wrangler.rybbit-worker.jsonc)):

1. `wrangler deploy`
2. Dashboard → route `yourdomain.com/analytics/*`
3. Script tag only in app HTML; secrets via Infisical per fenod-tech-stack

## Agent prompt (copy-paste)

One-liner — full checklist, templates, and pitfalls are in this skill + [reference.md](reference.md):

```
Add Rybbit analytics using the rybbit-analytics skill.

Prod: <URL> | Site ID: <PUBLIC_RYBBIT_SITE_ID> | Deploy: <Cloudflare Pages | Workers zone route | Astro SSR | TanStack Start>
RYBBIT_HOST: https://a.fno.ovh
```

## Reference

- Full patterns, troubleshooting, official links: [reference.md](reference.md)
- Reference repo: `audrain-patrimoine` (`docs/ANALYTICS.md`, `docs/agents/`)
