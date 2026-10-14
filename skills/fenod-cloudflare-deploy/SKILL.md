---
name: fenod-cloudflare-deploy
description: Configure and operate Fenod projects on Cloudflare with Wrangler, evaluate cf migrations or Alchemy 2 adoption, and prepare CI deployment, bindings, secrets, token scope and observability. Use for Cloudflare project configuration or deployment tooling changes; production actions follow the repository authority boundary.
---

# Fenod Cloudflare Deploy

**Stack Contract is law.** Cloudflare is the default target. **Wrangler is the default deploy path.**

## Golden rules

- **Workers everywhere**, including static assets. Pages is not sunset, but frozen — no new Pages projects.
- **Who deploys:** agents push Git. They do not run `wrangler deploy`, `cf deploy` or `alchemy deploy` to staging/prod. Remote resource commands follow the same authority boundary.
- **One Worker:** Workers Builds Git-connect, or CI `wrangler.jsonc` + `wrangler deploy`.
- **Optional cf:** beta toolbox beside Wrangler. Separate login/account selection; data commands default remote. Do not use `cf dev` / `cf build` / `cf deploy` in an unmigrated Wrangler project. Read `docs/cloudflare-tooling.md` for a migration.
- **Evaluate Alchemy 2:** shared resource lifecycle, repeatable stages/previews, multi-account ownership or lifecycle tests. Resource counts do not force adoption. A written need and pinned pilot must prove adoption, isolation and state recovery. Once adopted, protected CI owns deploys; never also Git-connect those Workers.
- **Smallest Alchemy unit:** site files → site; admin → admin; API/DB/auth/bindings → core; two units or shared config → all.
- Use current Alchemy v2 docs, not v1 examples. Package is `alchemy`. Start in IaC-only mode with conventional app handlers; integrated Effect runtime is optional. Effect application code only in the opt-in Effect lane (`docs/effect-lane.md`).
- Every Worker: today's `compatibility_date` + `observability.enabled = true` + an error alert. Dates `>= 2026-08-04` already include `nodejs_compat` — do not paste the flag. `nodejs_als` only for Sentry/ALS. Product apps add Sentry.
- Staging / `*.workers.dev` previews / internal admin: **Cloudflare Access**. Public marketing/docs: no. Access ≠ Better Auth.
- EmDash admin: supported CMS Access adapter on `/_emdash/*`, with EmDash roles and operator bootstrap; its auth/schema are a bounded CMS exception. Read `docs/astro-emdash.md` before configuring a CMS site.
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
# Human OAuth terminal only; protected CI retains its injected scoped token.
env -u CLOUDFLARE_API_TOKEN wrangler deploy --env staging
```

If the app uses Varlock's Cloudflare integration, the deploy command is
`env -u CLOUDFLARE_API_TOKEN varlock-wrangler deploy` instead, run from the app
root. Plain `wrangler deploy` fails there with code 10021 `initVarlockEnv failed`
because the built Worker needs the serialized `__VARLOCK_ENV` blob that only the
wrapper uploads. Inventory vars and secrets around that deploy: an undeclared
secret is not removed automatically.

## Alchemy

Only after a written infrastructure need and pinned Alchemy 2 pilot. Read `docs/cloudflare-tooling.md` for the adoption gate and current upstream sources. Do not scaffold `alchemy.run.ts` for a resource count or for a one-Worker CMS by default.

GitHub Action owns Cloudflare tokens (`staging` / `production` environments). Push `dev` deploys staging. Push `main` deploys prod behind protection. A branch preview is not staging.

## Compute chooser

| Workload | Use |
| ---------- | ----- |
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
| ------ | ------ |
| Law | `docs/stack-contract.md` |
| Recipes | `docs/recipes.md` |
| cf / Alchemy 2 adoption | `docs/cloudflare-tooling.md` |
| Astro + EmDash | `docs/astro-emdash.md` |
| Security | `docs/security-model.md` |
| Proof | `examples/smoke` |
