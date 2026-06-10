---
name: fenod-cloudflare-deploy
description: Deploy and operate Fenod projects on Cloudflare — Alchemy IaC, Wrangler, environments, Infisical secrets, API token scoping, and choosing between Workers, Dynamic Workers, and Containers. Use this skill whenever deploying anything, configuring wrangler.jsonc or alchemy.run.ts, handling secrets or environment variables, creating Cloudflare API tokens, setting up CI/CD, or when the user mentions deploy, staging, production, D1 migrations in prod, R2, KV, Queues, or Workers bindings.
---

# Fenod Cloudflare Deploy

Cloudflare is the default and only deployment target unless a project documents otherwise. Alchemy is the IaC layer, Wrangler the dev/debug CLI, Infisical the secret store.

## Golden rules

- **Workers everywhere, including static sites** (static assets on Workers). Cloudflare Pages is legacy-only; do not start new projects on it.
- **Never commit secrets.** Commit `infisical.json`; never `.env`, `.env.local`, `.dev.vars`. If a tool insists on dotenv, generate `.env.local` temporarily and delete it.
- **Local commands run through Infisical:** `infisical run --env=dev -- pnpm dev`. Deploys: `infisical run --env=staging -- pnpm deploy:staging`, or CI fetches secrets at runtime.
- Sync only **runtime** secrets to Cloudflare Worker secrets; keep non-secret config in Alchemy/Wrangler `vars`.
- Validate both Node-side deploy env and Worker `env` bindings with **Zod** — never trust raw env. Pattern in `src/content/docs/deployment.md` ("Env Validation with Zod").
- **R2 does not support presigned POST.** Never assert S3-API compatibility for a feature without verifying it in Cloudflare docs first.

## API tokens and agents

- Local human work: **OAuth via Wrangler login**.
- CI/automation: **scoped API tokens**, least privilege per resource (Workers, D1, KV, R2, Queues, DNS — only what the project touches).
- **Never hand a broad account token to an AI agent.** Agents get project-scoped tokens or, better, go through brokered deploys. Details and token recipes: `src/content/docs/cloudflare-api-tokens.md`. Threat model: `src/content/docs/security-model.md`.

## Alchemy quick pattern

```ts
// alchemy.run.ts
import alchemy from 'alchemy-framework'

export default alchemy({
  name: 'my-app',
  phase: process.env.ALCHEMY_PHASE ?? 'development',
  async run({ phase }) {
    const isProduction = phase === 'production'
    const database = await alchemy.D1Database('main-db', {
      name: isProduction ? 'prod-db' : 'dev-db',
    })
    const worker = await alchemy.Worker('api', {
      name: isProduction ? 'prod-api' : 'dev-api',
      main: './dist/worker.js',
      bindings: { DB: database /* KV, R2, ... */ },
    })
  },
})
```

Stages (`STAGE`/`ALCHEMY_PHASE`) must map to **isolated Cloudflare resources** — never share a D1 database between staging and production.

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

Full decision guide: `src/content/docs/cloudflare-compute.md`.

## Pre-deploy checklist

1. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass.
2. Env validated by Zod on both sides (deploy script and Worker bindings).
3. D1 migrations reviewed; production migration has a backup or rollback path.
4. Runtime secrets present in Worker secrets or injected during the Alchemy deploy.
5. Staging deployed and smoke-tested before production.

## Deep references

Resolve `src/content/docs/<slug>.md` in this order:
1. `../../src/content/docs/<slug>.md` relative to this skill (inside the `fenod-tech-stack` checkout);
2. `~/dev/fenod-tech-stack/src/content/docs/<slug>.md`;
3. `https://raw.githubusercontent.com/tristanremy/fenod-tech-stack/main/src/content/docs/<slug>.md`.

| When you need | Read |
|---------------|------|
| Full deploy guide, CI/CD YAML, checklists | `DEPLOYMENT.md` |
| Infisical setup, secret flow, safe deploy env | `ENVIRONMENT-SECRETS.md` |
| Token scoping recipes, Wrangler auth, agent guardrails | `CLOUDFLARE-API-TOKENS.md` |
| Worker vs Dynamic Worker vs Container | `CLOUDFLARE-COMPUTE.md` |
| Secrets, prompt injection, production gates | `SECURITY-MODEL.md` |
| Inbound/outbound email, deliverability | `EMAIL.md` |
| Workers AI vs AI Gateway vs Replicate | `AI-PROVIDERS.md` |
