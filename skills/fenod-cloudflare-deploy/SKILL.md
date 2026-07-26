---
name: fenod-cloudflare-deploy
description: Deploy and operate Fenod projects on Cloudflare — Wrangler-first deploys, Alchemy v2 trigger cases, environments, secrets managers, API token scoping, observability, rate limiting, and choosing between Workers, Dynamic Workers, and Containers. Use this skill whenever deploying anything, configuring wrangler.jsonc or alchemy.run.ts, handling secrets or environment variables, creating Cloudflare API tokens, setting up CI/CD, or when the user mentions deploy, staging, production, D1 migrations in prod, R2, KV, Queues, or Workers bindings.
---

# Fenod Cloudflare Deploy

**Stack Contract is law.** Cloudflare is the default target. **Wrangler is the default deploy path.**

## Golden rules

- **Workers everywhere**, including static assets. Pages only for already-connected legacy static/docs sites.
- **Default:** `wrangler.jsonc` + `wrangler deploy`.
- **Alchemy v2 only when triggered:** 4+ CF resources with shared lifecycle, 3+ stages beyond Wrangler envs, infra tests/OTel as code, or multiple accounts.
- Never use Alchemy v1 examples. Package is `alchemy`. Effect stays inside Alchemy config — not app architecture law.
- Every Worker: `observability.enabled = true` + an error alert. Product apps add Sentry.
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
  "compatibility_date": "2026-06-01",
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

Only after triggers match. See `deployment.md` for the Effect-based v2 shape. Do not scaffold `alchemy.run.ts` on day-one SME apps.

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
| Law | `stack-contract.md` |
| Full deploy depth | `deployment.md` |
| Secrets | `environment-secrets.md` |
| Tokens | `cloudflare-api-tokens.md` |
| Observability | `observability.md` |
| Security | `security-model.md` |
