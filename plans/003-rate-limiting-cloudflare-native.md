# 003 — Rate limiting: Cloudflare-native, drop the Redis pattern

| | |
|---|---|
| Status | DONE |
| Priority | 3 |
| Effort | S |
| Risk | Low |
| Written against | commit `4f918dc` |
| Depends on | nothing (parallel to 001) |

## Why this matters

`.env.example:61-66` offers `REDIS_URL` for "distributed rate limiting" — an off-Cloudflare pattern that contradicts the stack. An agent following it will provision a Redis nobody needs. And the handbook has **no rate limiting implementation anywhere**: `grep -ci "redis" src/content/docs/code-patterns.md` → 0, `grep -ci "rate limit" src/content/docs/code-patterns.md` → 1 (a passing mention), app-improvement-guide.md says "Implement rate limiting on auth endpoints" without showing how. This plan removes the wrong hint and adds the right pattern.

## Current state (verified at 4f918dc)

`.env.example:61-66`:
```
# Rate Limiting
# Redis URL for distributed rate limiting (optional)
# If not set, falls back to in-memory or database storage
REDIS_URL=
```

## Steps

1. **Delete the Redis block from `.env.example`** (the whole Rate Limiting section — the native binding needs no env var). Verify: `grep -c "REDIS" .env.example` → 0.
2. **Add a `## Rate Limiting` section to `src/content/docs/code-patterns.md`**, near the auth patterns, in the Implementation Recipe style (exact config, commands, gotcha, verification):
   - Default: the Workers **rate limiting binding** — wrangler.jsonc config + `env.RATE_LIMITER.limit({ key })`. **Fetch https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ at execution time**; the config namespace has changed before, do not write it from memory.
   - One paragraph: Durable Object when fixed-window semantics aren't enough (per-tenant quotas, sliding windows); link the DO docs, don't implement.
   - A Hono middleware example wiring the binding onto auth routes (key = `CF-Connecting-IP` anonymous, user id authenticated), matching the existing Hono style in the page. Bump `verified:`.
3. **`src/content/docs/app-improvement-guide.md`:** link the auth-rate-limiting bullet to the new section.
4. **`skills/fenod-cloudflare-deploy/SKILL.md`** golden rule: "Rate limiting uses the Workers rate limiting binding (or a DO for custom semantics) — never an external Redis."
5. **Optional, recommended:** one-line Gotchas entry in `src/content/docs/gotchas.md`: "Redis has no place in this stack — KV caches, the rate limiting binding / DOs limit."
6. **French alignment:** `src/content/docs/fr/code-patterns.md` is a full 2548-line translation — mirror the new section or add the explicit drift note per `/freshness/`.
7. **Run `pnpm check`.**

## Out of scope

- AI Gateway budget/rate limits (ai-providers.md, security-model.md, cloudflare-api-tokens.md) — different, correct concept. Leave alone.
- No Redis-for-caching discussion; KV owns caching.

## Done criteria

- `pnpm check` passes; greps in steps 1-2 pass.
- The snippet matches the fetched Cloudflare page (binding name, config key, method signature).

## Escape hatches

- If the binding is still beta/"unsafe"-namespaced at execution time: keep it as default with one sentence noting the flag, present DO as the conservative alternative. If removed/renamed entirely: STOP, report.

## Maintenance note

When Cloudflare graduates the binding out of its current namespace, update snippet + skill in the same commit.
