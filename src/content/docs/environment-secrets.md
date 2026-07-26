---
title: "Environment and Secrets"
verified: 2026-06
---

[Disponible en francais](/environment-secrets/)

> **Infisical** is the default human/CI secrets source of truth. Keep `.env` files out of repos. Cloudflare gets only the Worker runtime secrets it needs. **[Stack Contract](/stack-contract/) is law.**

## Recommended Model

| Layer | Source of truth | How apps receive values |
|-------|-----------------|-------------------------|
| Local development | Infisical project | `infisical run --env=dev -- pnpm dev` |
| Scripts and migrations | Infisical project | `infisical run --env=dev -- pnpm db:migrate` |
| Cloudflare runtime secrets | Infisical → Worker secrets (sync or deploy-time inject) | Worker `env` bindings |
| Non-secret config | Git-tracked config or Cloudflare `vars` | Plain bindings / `vars` |
| CI deploy identity | GitHub OIDC or short-lived machine identity | Infisical fetch, then **Wrangler** (Alchemy only on triggers) |

Infisical stores secrets. Cloudflare receives only what each Worker needs. App code still validates env at startup with Zod. Bitwarden SM is not the Fenod default — only with an explicit project override.

## Secret Classification

### Store in Infisical

- API tokens: `CLOUDFLARE_API_TOKEN`, email provider keys, analytics tokens
- Auth/session secrets: `BETTER_AUTH_SECRET`
- OAuth client secrets: `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_SECRET`
- Webhook URLs that can trigger deploys or mutations
- Alchemy password/state encryption secrets, when used

### Keep as non-secret config

- public URLs: `BETTER_AUTH_URL`, `PUBLIC_API_URL`, `SITE_URL`
- environment/stage names: `STAGE=dev|staging|prod`
- Cloudflare account ID and zone ID only if your threat model allows it; otherwise keep them in Infisical too
- feature flags that reveal no private behavior

### Never commit

- `.env`, `.env.local`, `.dev.vars`, production Wrangler secret values
- Cloudflare API tokens
- Infisical machine identity client secrets
- database exports or backups containing real user data

## Project Setup

Install and connect the CLI once per project:

```bash
brew install infisical/get-cli/infisical
infisical login
infisical init
```

`infisical init` creates `infisical.json`, which is safe to commit because it identifies the Infisical project but does not contain secret values.

Suggested Infisical environments:

| Infisical environment | App stage | Notes |
|-----------------------|-----------|-------|
| `dev` | `dev` / local | Developer-safe credentials and local-only callbacks |
| `staging` | `staging` | Mirrors production topology but disables risky side effects like real email |
| `prod` | `prod` | Production credentials; protect with approvals |

Suggested secret paths:

| Path | Purpose |
|------|---------|
| `/` | Shared app secrets used by most commands |
| `/cloudflare` | Cloudflare deploy credentials and account-level tokens |
| `/email` | Transactional email provider keys |
| `/oauth` | OAuth client IDs/secrets |

## Local Commands

Prefer command injection over generating local `.env` files:

```bash
# Run the whole monorepo with dev secrets
infisical run --env=dev -- pnpm dev

# Run a specific app/package
infisical run --env=dev -- pnpm --filter server dev

# Run migrations or scripts with deploy credentials
infisical run --env=dev --path=/cloudflare -- pnpm db:migrate
```

If a tool absolutely requires dotenv files, generate them ephemerally and delete them after use:

```bash
infisical export --env=dev --format=dotenv > .env.local
# run the tool
rm .env.local
```

Do not make generated dotenv files part of the normal workflow.

## Cloudflare Deployment Options

### Option A: Infisical Cloudflare Workers Sync

Use this when you want Cloudflare to hold the runtime secrets before deploy.

1. In Infisical, create a Cloudflare connection with a token scoped to the account and target Workers.
2. Add a Cloudflare Workers secret sync for each Worker/environment.
3. Sync only runtime secrets, not every project secret.
4. In `alchemy.run.ts`, bind required secret names with `alchemy.secret(...)` or reference existing Worker secrets.
5. Deploy with Alchemy/Wrangler using deploy identity credentials from Infisical or CI.

This is the cleanest path for Cloudflare Workers because secrets live in Cloudflare as encrypted Worker secrets at runtime.

### Option B: Deploy-time Infisical injection

Use this when Alchemy needs the secret value while creating/updating resources:

```bash
infisical run --env=staging -- pnpm deploy:staging
infisical run --env=prod -- pnpm deploy:prod
```

Example `alchemy.run.ts` pattern:

```ts
const stage = process.env.STAGE ?? "dev";

export const server = await Worker("server", {
  name: `my-app-server-${stage}`,
  bindings: {
    BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET!),
    BETTER_AUTH_URL:
      stage === "prod" ? "https://api.example.com" : "https://api.staging.example.com",
  },
});
```

This matches the CAPM pattern: stage-scoped resource names, domain mapping in code, secrets injected only into the deploy process.

### Option C: CI runtime fetch with OIDC

Use this for GitHub Actions:

1. Create an Infisical machine identity that trusts GitHub OIDC for the repo/workflow.
2. Use Infisical's GitHub action to fetch secrets at job runtime.
3. Run `pnpm predeploy` and `pnpm deploy:*` with those environment variables.
4. Keep only the Infisical identity/bootstrap configuration in GitHub; avoid duplicating app secrets in GitHub Secrets.

## Recommended `package.json` Scripts

```json
{
  "scripts": {
    "predeploy": "pnpm fmt && pnpm lint && pnpm typecheck && pnpm doctor:react:diff",
    "deploy": "pnpm predeploy && pnpm exec alchemy deploy",
    "deploy:staging": "STAGE=staging pnpm deploy",
    "deploy:prod": "STAGE=prod pnpm deploy",
    "deploy:staging:secrets": "infisical run --env=staging -- pnpm deploy:staging",
    "deploy:prod:secrets": "infisical run --env=prod -- pnpm deploy:prod"
  }
}
```

Keep the plain scripts useful for CI jobs that already fetched secrets. Use the `:*:secrets` scripts locally.

## Cloudflare Worker Runtime Pattern

Validate bindings, not `process.env`, inside Worker request code:

```ts
import { z } from "zod";

export const envSchema = z.object({
  DB: z.custom<D1Database>(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const parsedEnv = envSchema.parse(env);
    // use parsedEnv.DB, parsedEnv.BETTER_AUTH_SECRET, ...
  },
};
```

Use `process.env` only in Node-side tooling such as Alchemy, Drizzle config, scripts, and CI.

## CAPM-Inspired Deployment Hardening

Bring these patterns into new Fenod projects:

- Use a single `STAGE` variable (`dev`, `staging`, `prod`) and derive resource names from it.
- Keep domain maps in `alchemy.run.ts` so staging/prod hostnames are explicit and reviewable.
- Use isolated D1/R2/KV/Queue resources per stage.
- Adopt existing Cloudflare resources only when migrating an already-live project.
- Disable real outbound email in staging by injecting empty provider credentials or a sandbox provider.
- Require backups before production D1 migrations, destructive R2 operations, or DNS changes.
- Keep production deploys approval-gated even if preview/staging deploys are autonomous.

## Checklist

### New project

- [ ] Create Infisical project with `dev`, `staging`, and `prod` environments.
- [ ] Commit `infisical.json`; do not commit dotenv files.
- [ ] Add `.env.local`, `.dev.vars`, and backup dumps to `.gitignore`.
- [ ] Add Zod validation for Cloudflare bindings and Node-side deploy env.
- [ ] Decide whether runtime secrets reach Cloudflare via Workers Sync or deploy-time injection.
- [ ] Add `deploy:*:secrets` scripts for local use.

### Before production deploy

- [ ] `pnpm predeploy` passes.
- [ ] Infisical prod secrets are complete and reviewed.
- [ ] Cloudflare runtime secrets are synced or deploy-time injection is tested.
- [ ] D1 migrations are backed up and rehearsed on staging.
- [ ] Staging uses production-like domains/resources but safe side effects.
- [ ] Production deploy command is run from CI or an approved local session.
