# Rybbit analytics — reference

## Official docs

- [Proxy overview](https://rybbit.com/docs/proxy-guide)
- [Astro](https://rybbit.com/docs/proxy-guide/astro)
- [Cloudflare Workers](https://rybbit.com/docs/proxy-guide/cloudflare-workers)
- [Get started (generic)](https://rybbit.com/docs/proxy-guide/get-started)

## Environment variables

| Variable | Secret? | Where |
|----------|---------|--------|
| `PUBLIC_RYBBIT_SITE_ID` | No (public in HTML) | `.env`, CI build, Astro |
| `RYBBIT_HOST` | No | `.env`, `wrangler.toml` `[vars]`, Worker dashboard |

## Worker + assets (`run_worker_first`)

```jsonc
{
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "run_worker_first": ["/analytics", "/analytics/*"]
  },
  "vars": { "RYBBIT_HOST": "https://a.fno.ovh" }
}
```

```ts
import { proxyToRybbit } from './lib/rybbit-proxy';

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/analytics')) {
      return proxyToRybbit(request, url.pathname, url.search, env.RYBBIT_HOST);
    }
    return env.ASSETS.fetch(request);
  },
};
```

## Astro SSR middleware

```ts
// src/middleware.ts
import type { MiddlewareHandler } from 'astro';
import { proxyToRybbit } from '../lib/rybbit-proxy';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/analytics')) {
    return proxyToRybbit(
      context.request,
      url.pathname,
      url.search,
      import.meta.env.RYBBIT_HOST,
    );
  }
  return next();
};
```

Requires `output: 'server'` or `hybrid` + adapter. Not for fully static Pages deploys.

## Vite dev proxy (Astro)

Use a **static** `defineConfig({ … })` object — not a function callback. A function config breaks `build.inlineStylesheets: 'always'` and can leave Tailwind utilities ungenerated (site looks unstyled).

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const rybbitHost = process.env.RYBBIT_HOST || 'https://a.fno.ovh';

export default defineConfig({
  build: {
    inlineStylesheets: 'always', // keep if project already uses it
  },
  vite: {
    plugins: [tailwindcss()], // omit if not using Tailwind
    server: {
      proxy: {
        '/analytics': {
          target: rybbitHost,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/analytics/, '/api'),
        },
      },
    },
  },
});
```

Read `RYBBIT_HOST` via `process.env` (or hardcode for dev). Do **not** wrap config in `defineConfig(({ mode }) => …)` with `loadEnv` unless the project already uses that pattern **and** does not rely on `inlineStylesheets`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 404 `/analytics/*` | Pages Function missing or deploy not from repo root |
| Worker not running | Zone route `domain.com/analytics/*` |
| No events | Wrong site ID; POST body not forwarded |
| Wrong geo | Forward `CF-Connecting-IP` |
| Fenod app breaks | Use standalone Worker, not TanStack `server-entry` patch |
| Site unstyled after adding proxy | Static `defineConfig({})`; verify build has inlined `<style>` or CSS with `.flex` / utility classes |

## Zone route deploy (standalone Worker)

```bash
cd workers/rybbit-proxy   # after copying templates
wrangler deploy
# Dashboard → Triggers → yourdomain.com/analytics/*
```
