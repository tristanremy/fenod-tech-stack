---
name: fenod-cloudflare-deploy
description: Deploy and operate Fenod projects on Cloudflare — Wrangler-first deploys, Alchemy v2 trigger cases, environments, secrets managers, API token scoping, observability, rate limiting, and choosing between Workers, Dynamic Workers, and Containers. Use this skill whenever deploying anything, configuring wrangler.jsonc or alchemy.run.ts, handling secrets or environment variables, creating Cloudflare API tokens, setting up CI/CD, or when the user mentions deploy, staging, production, D1 migrations in prod, R2, KV, Queues, or Workers bindings.
---

# Fenod Cloudflare Deploy

**Stack Contract is law.** Cloudflare is the default target. **Wrangler is the default deploy path.**

## Golden rules

- **Workers everywhere**, including static assets. Pages is not sunset, but frozen — no new Pages projects.
- **Who deploys:** agents push Git. They do not run `wrangler deploy` or `alchemy deploy` to staging/prod.
- **One Worker:** Workers Builds Git-connect, or CI `wrangler.jsonc` + `wrangler deploy`.
- **2+ Workers that share bindings:** Alchemy via GitHub Action. Never Git-connect those Workers — that overwrites bindings outside Alchemy state.
- **Alchemy also when:** 4+ CF resources with shared lifecycle, 3+ stages, infra tests/OTel as code, or multiple accounts.
- **Smallest Alchemy unit:** site files → site; admin → admin; API/DB/auth/bindings → core; two units or shared config → all.
- Never use Alchemy v1 examples. Package is `alchemy`. Effect stays inside Alchemy config — not app architecture law.
- Every Worker: today's `compatibility_date` + `observability.enabled = true` + an error alert. Dates `>= 2026-08-04` already include `nodejs_compat` — do not paste the flag. `nodejs_als` only for Sentry/ALS. Product apps add Sentry.
- Staging / `*.workers.dev` previews / internal admin: **Cloudflare Access**. Public marketing/docs: no. Access ≠ Better Auth.
- Rate limits: Workers rate limiting binding or DO. **No Redis.**
- Never commit secrets. **Infisical** + Worker secrets at runtime (Bitwarden SM only with project override).
- Local Wrangler:

```bash
env -u CLOUDFLARE_API_TOKEN wrangler whoami
```

- Validate deploy env and Worker bindings with Zod.
- R2 is not full S3. Verify features before assuming S3 APIs (no presigned POST).

## Tokens

- Local human: Wrangler OAuth.
- CI: resource-scoped API tokens.
- Never give agents broad account tokens.

## Wrangler pattern

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-app",
  "main": "./dist/worker.js",
  "compatibility_date": "2026-08-19",
  "assets": {
    "directory": "./dist/client",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*"]
  },
  "observability": { "enabled": true, "head_sampling_rate": 1 }
}
```

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
# secrets manager injects env, e.g. infisical run --env=staging -- wrangler deploy --env staging
env -u CLOUDFLARE_API_TOKEN wrangler deploy --env staging
```

## Alchemy

Only after triggers match. See `deployment.md`. Do not scaffold `alchemy.run.ts` on a one-Worker SME app.

GitHub Action owns Cloudflare tokens (`staging` / `production` environments). Push `dev` deploys staging. Push `main` deploys prod behind protection. A branch preview is not staging.

## Compute chooser

| Workload | Use |
|----------|-----|
| API, SSR, static | Worker |
| Per-tenant isolates | Dynamic Workers |
| Heavy native/long CPU | Container (last resort) |
| Durable multi-step | Workflows |
| Async fan-out | Queues |
| Stateful coordination | Durable Objects |

## Pre-deploy

1. Ship/merge gates green.
2. Env validated both sides.
3. D1 migrations reviewed; prod has rollback/backup path.
4. Runtime secrets present.
5. Observability + alert on.
6. Staging smoke before prod.

## Deep references

| Need | Read |
|------|------|
| Law | `docs/stack-contract.md` |
| Recipes | `docs/recipes.md` |
| Security | `docs/security-model.md` |
| Proof | `examples/smoke` |
