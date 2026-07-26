---
title: "Cloudflare Enhancements Radar"
description: "Ranked Cloudflare features to add to Fenod projects by value for effort."
verified: 2026-07
---

[Disponible en francais](/fr/cloudflare-enhancements/)

This page tracks recent Cloudflare platform features that should shape Fenod defaults. Rank is **value for effort**: high-value, low-ceremony features come first.

## Default Path

1. **Workers Cache for cacheable SSR** — enable Worker-level HTTP caching for TanStack Start and Astro SSR; set `Cache-Control` on public responses and let Cloudflare skip Worker execution on hits.
2. **Cache tags + purge** — tag CMS, docs, catalog, and public API responses, then purge tags from admin mutations or webhooks instead of rebuilding whole sites.
3. **Asynchronous `stale-while-revalidate`** — prefer `public, max-age=300, stale-while-revalidate=3600` for public pages that can tolerate soft staleness.
4. **Workers Static Assets** — deploy new Astro/Starlight/static apps as Workers with static assets, not new Pages projects.
5. **Cloudflare Vite plugin** — use workerd-backed local dev for Vite apps where framework support is mature.
6. **Workers Logs + automatic traces across Worker/DO subrequests** — make distributed Worker flows debuggable before adding third-party observability.
7. **Workers and Durable Object memory metrics** — check P90/P99 memory before guessing at performance fixes.
8. **Bulk secrets API / Secrets Store bindings** — use for deploy automation; never commit plaintext `.env` files.
9. **D1 read replication + Sessions API** — use for read-heavy apps, dashboards, catalogs, and CMS surfaces once the app has real regional read pressure.
10. **Queues on the Free plan** — default tiny async jobs to Queues instead of inline request work.
11. **Workflows rollback handlers** — use for payments, onboarding, imports, and multi-step external side effects.
12. **Workflows higher concurrency/control-plane v2** — use for large fan-out jobs and agent loops when Queues alone are not enough.
13. **Durable Object jurisdiction controls** — use for projects with clear residency constraints.
14. **Durable Object facets** — consider for multi-tenant agent/app platforms that need isolated per-app state.
15. **Dynamic Workers** — use only for untrusted or AI-generated code execution; normal apps stay on ordinary Workers.
16. **Dynamic Workflows** — pair with Dynamic Workers when runtime-loaded code needs durable execution.
17. **Containers** — use for existing images, native binaries, long-lived WebSockets, or heavy CPU/memory needs; do not use for normal API routes.
18. **Browser Run** — use for hosted browser automation, scraping verification, and agent browsing when local Playwright is not enough.
19. **Agents SDK (`agents`)** — use for Cloudflare-native agents that need state, tools, browser/code execution, and recovery.
20. **AI Gateway as unified inference layer** — keep provider keys, routing, retries, logs, and budgets outside app code.
21. **Workers AI newer coding/reasoning models** — use for low-latency edge AI tasks; keep app code provider-agnostic through AI Gateway.
22. **Vectorize list-vectors operation** — use for audits, migrations, and cleanup of vector indexes.
23. **R2 SQL improvements** — use for analytics over R2/Iceberg data before adding a warehouse.
24. **Event subscriptions into Queues** — react to Cloudflare account/service events without polling.
25. **Hyperdrive + Cloudflare-billed PlanetScale** — only for projects explicitly choosing external Postgres/MySQL; D1 remains default.
26. **Temporary Wrangler deployments for agents** — useful for previews and demos; production deploys still require real account auth and review.
27. **`@cloudflare/workers-types` v5** — use for new Worker TypeScript projects to avoid stale runtime types.
28. **Import `env` from `cloudflare:workers`** — use when a binding is needed outside the request handler; otherwise pass `env` explicitly.
29. **Source map stack trace remapping** — enable for production Workers where stack traces matter.
30. **Workers Cache cross-version cache** — opt in only for stable public content where deploys should not cold-start the cache.

## SSR Cache Recipe

Use this for public TanStack Start loaders/routes, Astro SSR pages, CMS pages, docs, catalogs, and unauthenticated GET APIs.

```ts
return new Response(html, {
  headers: {
    "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    "Cache-Tag": `posts,post:${post.id}`,
  },
});
```

Purge by tag after mutations or webhooks:

```ts
await purge({ tags: [`post:${id}`, "posts"] });
```

## Use Something Else When

- The response is user-specific, private, or auth-scoped. Do not public-cache it.
- The page is truly static forever. Astro SSG or Workers Static Assets is simpler.
- The workload is one-off and tiny. Inline code is fine before Queues/Workflows.
- A Cloudflare feature is beta and would become client-critical infrastructure without a rollback path.

## Source Notes

Recent sources checked: Workers Cache launch and docs, Workers Cache purge/cache-key docs, asynchronous stale-while-revalidate changelog, Workers/Durable Objects/Workflows/D1/Queues/Vectorize/R2 SQL/Hyperdrive/Workers AI changelogs, and Agents Week 2026 announcements.

## Related Guides

- [Stack Contract](/stack-contract/)
- [Stack Overview](/stack-overview/)
- [Cloudflare Compute](/cloudflare-compute/)
- [Deployment](/deployment/)
- [Observability](/observability/)
