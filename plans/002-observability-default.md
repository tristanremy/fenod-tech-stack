# 002 — Default observability: Workers Logs baseline everywhere, Sentry for product apps

| | |
|---|---|
| Status | DONE |
| Priority | 2 |
| Effort | S |
| Risk | Low (docs + skill only) |
| Written against | commit `4f918dc` |
| Depends on | 001 (both edit deployment.md) |

## Why this matters

The handbook covers analytics (rybbit-analytics.md) and reactive debugging (debugging.md: wrangler tail, DevTools) but has **no page for persistent runtime error tracking**. Traces today: `.env.example:80-81` (`SENTRY_DSN=`, undocumented) and one checklist line in development-strategy.md. For a solo agency running N client Workers, a silently failing production Worker is the most expensive blind spot in the stack.

**Policy (decided):** two tiers.

- **Tier 1 — every deployed Worker:** Cloudflare Workers Observability (`"observability": { "enabled": true }` in wrangler.jsonc) + a Cloudflare error-rate notification so failures reach email. Zero dependency.
- **Tier 2 — product apps / paying users:** Sentry (Cloudflare Workers SDK). DSN in Infisical, synced as a Worker secret.

## Current state (verified at 4f918dc)

- No `src/content/docs/observability.md`. `ls src/content/docs/ | grep -i observ` → empty.
- `.env.example:79-81`: bare `SENTRY_DSN=`.
- Sidebar groups live in `astro.config.mjs` (the `Cloudflare` group lists `/deployment/`, `/cloudflare-compute/`, `/cloudflare-api-tokens/`, `/environment-secrets/` around lines 62-67).

## Steps

1. **Create `src/content/docs/observability.md`** following the Guide Shape (stack-contract.md): frontmatter `title: "Observability"`, `description`, `verified: <current YYYY-MM>`; sections **Default Path** (Tier 1: wrangler.jsonc snippet — reuse the existing observability key shown in deployment.md, explain `head_sampling_rate` and when to set 1; where to create the error alert in the CF dashboard), **Tier 2: Sentry** (install per the **current** official Sentry Cloudflare Workers guide — fetch docs.sentry.io at execution time, never from memory; DSN via Infisical → Worker secret, never in `vars`), **Gotchas** (sampling hides rare errors; alerts without a notification channel are useless), **Agent Notes** (the two-tier rule, one paragraph), **Related Guides** (`/debugging/`, `/deployment/`, `/environment-secrets/`).
2. **Sidebar:** add `{ icon: 'i-ph:heartbeat-duotone', label: 'Observability', link: '/observability/' }` to the Cloudflare group in `astro.config.mjs` (pick any sensible ph icon if that one doesn't exist — `pnpm build` will fail on a bad icon name, which is your check).
3. **`src/content/docs/deployment.md`:** add one checklist line to the deploy checklist — `- [ ] Observability enabled and error alert configured (see /observability/)`.
4. **`.env.example`:** comment above `SENTRY_DSN` → `# Tier 2 error tracking — see /observability/. Store in Infisical, sync as Worker secret.`
5. **`skills/fenod-cloudflare-deploy/SKILL.md`:** golden rule — "Every deployed Worker ships with observability.enabled = true and an error alert; product apps add Sentry (/observability/)." Add the page to the deep-references table.
6. **French page:** create `src/content/docs/fr/observability.md` (translation) or, minimum, a page carrying the explicit translation-drift note per `/freshness/`. The build may require the fr page to exist for the locale switcher — check how other fr pages are wired and match it.
7. **Run `pnpm check`** — must pass.

## Out of scope

- No Sentry account setup, no dashboards, no code in real projects.
- Logpush / tail workers / third-party sinks: one "beyond this guide" line max.
- Do not restructure debugging.md.

## Done criteria

- `pnpm check` passes (this validates the sidebar link, internal links, and llms.txt regeneration automatically).
- `/observability/` answers "client site just went live, what's the minimum?" in under a minute.

## Escape hatches

- If the Sentry Workers SDK guidance can't be fetched, ship Tier 1 fully, leave Tier 2 as a TODO-marked stub, report back.

## Maintenance note

If Cloudflare's observability schema changes (wrangler.jsonc keys), this page and deployment.md change together.
