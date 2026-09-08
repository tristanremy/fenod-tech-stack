---
title: "Astro content sites"
description: "A small static reference for safe metadata, JSON-LD and native images."
verified: 2026-09
---

Use **Astro for content/marketing**, not a full-stack app by default. Follow the [Stack Contract](stack-contract.md). Start with [`examples/astro`](../examples/astro/README.md): one private package, two static pages, no browser JavaScript. It is executable proof, not a published library or branded starter.

## Build and check

```bash
cd examples/astro
pnpm install --frozen-lockfile # Node 24
pnpm ship                   # format check, lint, .astro diagnostics, builds, HTML tests
portless --script preview   # optional local portless installation
```

Read the example README for its local URL and tooling compatibility notes. Root scripts do not install or run this standalone package.

## Metadata and structured data

- Use one `Head.astro` per page. It owns title, description, canonical and Open Graph. Interpolate titles normally (`<title>{title}</title>`), never with `set:html`.
- Set the explicit **public origin** in `src/lib/site.ts`. Canonicals use the route pathname, not a request/preview host. This static example has no query-identified content. Define that policy locally if queries identify real content. Add language alternates only for real translations.
- Pass typed, factual Schema.org data to `JsonLd.astro`. Only its serializer output uses `set:html`: Unicode escapes keep `</script>` inert and preserve strings after `JSON.parse`. Types do not validate CMS inputs or prove eligibility for Google rich results; validate external data at its boundary.
- Build previews with `pnpm build:preview` and serve **`dist-preview`**, not the production artifact. Every non-production build mode emits `noindex, nofollow`; canonical/OG URLs still point to the public origin. `noindex` is not security: protected previews need [Cloudflare Access](security-model.md#cloudflare-access-previews--staging--internal-admin), as a separately approved infrastructure action.

## Native media and release boundary

Keep local originals in `src/assets`. Use `astro:assets` `Image`, real dimensions, a few widths and `sizes` that match the layout. Use `priority` only on the visible lead/LCP candidate; use native lazy loading elsewhere. Sharp runs at build time here. The original PNG doubles as a static OG fixture; no OG generator, blur system or remote image service is needed.

Tests parse **generated HTML** on both routes and in both build modes: unique tags, public URLs, hostile text round trips, image files/dimensions/priority, and zero executable scripts/JS files. Negative controls prove failures are detected. Also check the built site in a browser on desktop/mobile, including navigation, image requests, console and overflow. Repeat builds must produce identical files in the same locked environment.

New static sites target **Workers static assets** (`dist`), without an SSR adapter, DB, auth or Alchemy. This reference creates no Worker and includes no deploy command. Deployment and Access setup belong to an approved project CI/human flow. No client migration or package publication is part of this example; pilots must validate any later shared API. Do not claim ranking, GEO or field CWV gains from these technical checks.
