---
name: fenod-cloudflare-deploy
description: Deploy and operate Fenod projects on Cloudflare — Wrangler-first deploys, Alchemy v2 trigger cases, environments, Infisical secrets, API token scoping, observability, rate limiting, and choosing between Workers, Dynamic Workers, and Containers. Use this skill whenever deploying anything, configuring wrangler.jsonc or alchemy.run.ts, handling secrets or environment variables, creating Cloudflare API tokens, setting up CI/CD, or when the user mentions deploy, staging, production, D1 migrations in prod, R2, KV, Queues, or Workers bindings.
---

# Fenod Cloudflare Deploy

Cloudflare is the default and only deployment target unless a project documents otherwise. Default deploy path is `wrangler.jsonc` + `wrangler deploy`; Alchemy v2 is conditional, not the default.

## Golden rules

- **Workers everywhere, including static sites** (static assets on Workers). Cloudflare Pages is legacy-only for existing connected projects; do not start new projects on it.
- **Default deploy path:** `wrangler.jsonc` + `wrangler deploy`.
- **Alchemy v2 only when triggered:** 4+ Cloudflare resources with shared lifecycle, 3+ stages beyond Wrangler envs, infra-level tests/OTel as code, or multiple Cloudflare accounts.
- **Never use Alchemy v1 examples.** Package is `alchemy`, not `the legacy Alchemy framework package`; v2 uses `Alchemy.Stack(...)` and `Cloudflare.Worker(...)`.
- **Every deployed Worker ships with observability:** `observability.enabled = true` and an error alert. Product apps add Sentry. See `/observability/`.
- **Rate limiting uses Cloudflare-native primitives:** Workers rate limiting binding, or Durable Objects for custom semantics. Never add external Redis for default rate limiting.
- **Never commit secrets.** Commit `infisical.json`; never `.env`, `.env.local`, `.dev.vars`. If a tool insists on dotenv, generate `.env.local` temporarily and delete it.
- **Local commands run through Infisical:** `infisical run --env=dev -- pnpm dev`. Deploys: `infisical run --env=staging -- wrangler deploy --env staging`, or CI fetches secrets at runtime.
- Sync only runtime secrets to Cloudflare Worker secrets; keep non-secret config in Wrangler `vars` or Alchemy config.
- Validate both Node-side deploy env and Worker `env` bindings with Zod.
- **R2 does not support presigned POST.** Never assert S3-API compatibility for a feature without verifying it in Cloudflare docs first.

## API tokens and agents

- Local human work: **OAuth via Wrangler login**.
- CI/automation: **scoped API tokens**, least privilege per resource.
- **Never hand a broad account token to an AI agent.** Agents get project-scoped tokens or brokered deploys.

## Wrangler quick pattern

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
pnpm check
infisical run --env=staging -- wrangler deploy --env staging
```

## Alchemy v2 quick pattern

```ts
import * as Alchemy from 'alchemy'
import * as Cloudflare from 'alchemy/Cloudflare'
import * as Effect from 'effect/Effect'
import Worker from './src/worker'

export default Alchemy.Stack(
  'MyApp',
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const worker = yield* Worker
    return { url: worker.url }
  }),
)
```

## Choosing compute

| Workload | Use | Why |
|----------|-----|-----|
| API, SSR, static serving | Worker | Default; isolate, instant start |
| Per-tenant / programmatic isolates | Dynamic Workers | ms startup, ~2 MB overhead, Workers-only feature |
| Heavy runtime, native deps, long CPU | Container | Last resort; seconds to start |
| Multi-step durable jobs | Workflows | Retries + state built in |
| Async fan-out | Queues | — |
| RAG / embeddings | Vectorize + Workers AI | — |
| Stateful coordination | Durable Objects | — |

## Pre-deploy checklist

1. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass.
2. Env validated by Zod on both sides.
3. D1 migrations reviewed; production migration has a backup or rollback path.
4. Runtime secrets present in Worker secrets or injected during deploy.
5. Observability enabled and error alert configured.
6. Staging deployed and smoke-tested before production.

## Deep references

Resolve `src/content/docs/<slug>.md` in this order:
1. `../../src/content/docs/<slug>.md` relative to this skill;
2. `~/dev/fenod-tech-stack/src/content/docs/<slug>.md`;
3. `https://raw.githubusercontent.com/tristanremy/fenod-tech-stack/main/src/content/docs/<slug>.md`.

| When you need | Read |
|---------------|------|
| Full deploy guide, CI/CD YAML, checklists | `deployment.md` |
| Observability and Sentry tiers | `observability.md` |
| Infisical setup, secret flow, safe deploy env | `environment-secrets.md` |
| Token scoping recipes, Wrangler auth, agent guardrails | `cloudflare-api-tokens.md` |
| Worker vs Dynamic Worker vs Container | `cloudflare-compute.md` |
| Secrets, prompt injection, production gates | `security-model.md` |
| Inbound/outbound email, deliverability | `email.md` |
| Workers AI vs AI Gateway vs Replicate | `ai-providers.md` |
