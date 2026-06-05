# Rybbit analytics (first-party proxy)

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

## Cursor skill (all repos)

`~/dev/dotfiles/skills/fenod/web/rybbit-analytics/` (symlinked to `~/.cursor/skills/...` via `dot symlinks-apply`) — decision tree, templates, checklists.

## Full agent guides (reference implementation)

Maintained with templates in the **audrain-patrimoine** reference repo:

| Guide | Contents |
|-------|----------|
| [Cloudflare Workers](../audrain-patrimoine/docs/agents/rybbit-cloudflare-workers.md) | Pattern A/B/C, zone routes, Fenod TanStack Start, caching |
| [Astro + Pages Functions](../audrain-patrimoine/docs/agents/rybbit-astro-proxy.md) | Static Astro, Vite dev proxy, Pages Function |
| [Worker template](../audrain-patrimoine/docs/templates/rybbit-worker.ts) | Copy-paste standalone Worker |

Sibling checkout: `dev/audrain-patrimoine` next to `dev/fenod-tech-stack`.

## Quick deploy (standalone Worker)

```bash
# From a project that copied the templates
wrangler deploy
# Dashboard → Triggers → Route: yourdomain.com/analytics/*
```

Forward visitor IP using `CF-Connecting-IP` (included in the template).

## Related stack docs

- [Cloudflare Compute](./CLOUDFLARE-COMPUTE.md) — Worker primitives
- [Deployment](./DEPLOYMENT.md) — Alchemy / Wrangler
- [Environment and Secrets](./ENVIRONMENT-SECRETS.md) — Infisical + Worker vars
- [Astro SEO Guide](./ASTRO-SEO-GUIDE.md) — layout / metadata patterns
