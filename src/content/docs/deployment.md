---
title: "Deployment Guide"
verified: 2026-06
---

[Disponible en français](/fr/deployment/)

> Deploy to Cloudflare with **Wrangler by default**. Alchemy v2 only on Stack Contract triggers. **[Stack Contract](/stack-contract/) is law.**

## Default Path

| Tool | Role |
|------|------|
| **Wrangler** | Default deploy + local dev (`wrangler.jsonc` + `wrangler deploy`) |
| **Workers** | Default runtime, including static assets |
| **Infisical** | Human/CI secrets source of truth; Worker secrets at runtime |
| **D1 / R2 / KV** | Default data/file/cache bindings |
| **Alchemy v2** | Optional IaC when triggers match — not day-one |

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
env -u CLOUDFLARE_API_TOKEN wrangler deploy
```

## Environment Configuration

Use [Environment and Secrets](/environment-secrets/) for the full secrets flow. Short version:

- never commit `.env`, `.env.local`, or `.dev.vars` with real values;
- run local commands with `infisical run --env=dev -- pnpm dev`;
- deploy with `infisical run --env=staging -- wrangler deploy --env staging` or CI after Infisical fetch;
- sync only runtime secrets to Cloudflare Worker secrets; keep non-secret config in Wrangler `vars`;
- validate Node-side deploy env and Worker `env` bindings with Zod.


### Env Validation with Zod

Never trust raw `process.env`. Validate at startup.

```ts
// packages/shared/src/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  CORS_ORIGIN: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('Invalid environment variables:')
    console.error(result.error.flatten().fieldErrors)
    throw new Error('Invalid environment configuration')
  }

  return result.data
}
```

### Cloudflare Bindings Type

```ts
// packages/shared/src/env.d.ts
export interface CloudflareEnv {
  DB: D1Database
  KV: KVNamespace
  R2: R2Bucket
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
}

declare global {
  interface Env extends CloudflareEnv {}
}
```

### Runtime Env Access (Cloudflare Workers)

```ts
// In Workers, env comes from request context, not process.env
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // env.DB, env.KV, etc. are available here
    const db = drizzle(env.DB)
  },
}
```

---

## Cloudflare Hosting Default

For new Fenod projects, prefer **Cloudflare Workers** as the deployment surface, including Workers Static Assets for static/docs/content sites. Workers cover static assets, framework apps, APIs, bindings, and request routing in one model.

Use **Cloudflare Pages** when a docs/static project is already connected to GitHub and the Pages integration is the lowest-friction publishing path. This Fenod Stack Handbook can stay on Pages for that reason, but new app starters should target Workers first.

## Default Path: Wrangler

For a typical SME app or site, use `wrangler.jsonc` and `wrangler deploy`. A one-Worker project with D1, KV, R2, static assets, and secrets does not need an IaC framework.

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-app",
  "main": "./dist/worker.js",
  "compatibility_date": "2026-06-01",
  "assets": {
    "directory": "./dist/client",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*", "/analytics/*"]
  },
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-app-prod",
      "database_id": "<database-id>"
    }
  ],
  "vars": {
    "APP_ENV": "production"
  }
}
```

Deploy with explicit environment context:

```bash
infisical run --env=staging -- wrangler deploy --env staging
infisical run --env=prod -- wrangler deploy --env production
```

Use Wrangler environments for simple dev/staging/prod isolation. Keep secrets in Infisical, CI secret storage, or Worker secrets; keep only non-secret config in `vars`.

## When to Use Alchemy (exception path)

Skip this section unless a trigger matches. App code should not become Effect-shaped just because Alchemy v2 uses Effect.

A project uses Alchemy v2 instead of plain Wrangler when **any** of these hold:

- 4+ Cloudflare resources whose lifecycle must be created/updated/deleted together;
- 3+ isolated stages beyond what Wrangler environments handle cleanly;
- infra-level tests or OTel wiring as code;
- multiple Cloudflare accounts.

Everything else (typical SME site/app: one Worker, one D1, maybe one R2): Wrangler only.

## Alchemy v2 Setup

Alchemy v2 is an Effect-based rewrite and is currently in beta. For a client project, validate the current Alchemy version and docs at adoption time. Do not use old legacy-package examples or v1 phase/run initializer examples for new work. Install the current package:

```bash
pnpm add -D alchemy effect
```

Minimal shape from the Alchemy v2 docs:

```ts
// alchemy.run.ts
import * as Alchemy from 'alchemy'
import * as Cloudflare from 'alchemy/Cloudflare'
import * as Effect from 'effect/Effect'
import Worker from './src/worker'

export default Alchemy.Stack(
  'MyApp',
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const worker = yield* Worker
    return { url: worker.url }
  }),
)
```

```ts
// src/worker.ts
import * as Cloudflare from 'alchemy/Cloudflare'
import * as Effect from 'effect/Effect'
import * as HttpServerResponse from 'effect/unstable/http/HttpServerResponse'

export default Cloudflare.Worker(
  'Worker',
  { main: import.meta.filename },
  Effect.gen(function* () {
    return {
      fetch: Effect.gen(function* () {
        return HttpServerResponse.text('Hello, world!')
      }),
    }
  }),
)
```

For local Alchemy credentials, use `alchemy login`; Alchemy stores profiles in `~/.alchemy/profiles.json`. Do not export `CLOUDFLARE_API_TOKEN` for local Alchemy work.

Deploy only after the normal quality gate:

```bash
pnpm check
pnpm exec alchemy deploy
```

Destroy resources only from an explicitly approved session:

```bash
pnpm exec alchemy destroy
```

## Wrangler Commands

### Development

```bash
# Start local dev server
wrangler dev

# Dev with remote D1 (useful for testing with real data)
wrangler dev --remote

# Dev with local D1
wrangler dev --local
```

### Database (D1)

```bash
# List databases
wrangler d1 list

# Create database
wrangler d1 create my-db

# Run SQL locally
wrangler d1 execute my-db --local --command "SELECT * FROM users LIMIT 5"

# Run SQL on remote
wrangler d1 execute my-db --remote --command "SELECT * FROM users LIMIT 5"

# Apply migration locally
wrangler d1 execute my-db --local --file ./db/migrations/0001_init.sql

# Apply migration to production
wrangler d1 execute my-db --remote --file ./db/migrations/0001_init.sql

# Export database
wrangler d1 export my-db --output backup.sql

# Import database
wrangler d1 execute my-db --file backup.sql
```

### KV

```bash
# List namespaces
wrangler kv namespace list

# Create namespace
wrangler kv namespace create my-kv

# Get value
wrangler kv key get --namespace-id <id> "my-key"

# Put value
wrangler kv key put --namespace-id <id> "my-key" "my-value"

# Delete value
wrangler kv key delete --namespace-id <id> "my-key"

# List keys
wrangler kv key list --namespace-id <id>
```

### R2

```bash
# List buckets
wrangler r2 bucket list

# Create bucket
wrangler r2 bucket create my-bucket

# Upload file
wrangler r2 object put my-bucket/path/file.txt --file ./local-file.txt

# Download file
wrangler r2 object get my-bucket/path/file.txt --file ./downloaded.txt

# Delete object
wrangler r2 object delete my-bucket/path/file.txt
```

### Logs & Debugging

```bash
# Stream live logs
wrangler tail

# Filter by status
wrangler tail --status error

# Filter by search term
wrangler tail --search "userId"

# JSON output
wrangler tail --format json

# Specific worker
wrangler tail my-worker-name
```

### Deployment

```bash
# Deploy worker
wrangler deploy

# Deploy to specific environment
wrangler deploy --env production

# Dry run (see what would deploy)
wrangler deploy --dry-run

# Check current deployment
wrangler deployments list
```

---

## Drizzle Migrations

### Configuration

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './packages/db/src/schema/*.ts',
  out: './packages/db/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID!,
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
})
```

### Commands

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate

# Push schema directly (dev only, no migration file)
pnpm drizzle-kit push

# Open Drizzle Studio
pnpm drizzle-kit studio

# Drop all and regenerate (dev only!)
pnpm drizzle-kit drop
```

### Migration Workflow

```bash
# 1. Make schema changes in packages/db/src/schema/*.ts

# 2. Generate migration
pnpm drizzle-kit generate

# 3. Review generated SQL in packages/db/migrations/

# 4. Apply to local D1
wrangler d1 execute my-db --local --file ./packages/db/migrations/0002_new_feature.sql

# 5. Test locally

# 6. Apply to production D1
wrangler d1 execute my-db --remote --file ./packages/db/migrations/0002_new_feature.sql
```

---

## Wrangler Configuration

### wrangler.jsonc (Recommended)

```jsonc
// wrangler.jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "my-app-api",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat_v2"],

  // Smart Placement: auto-locate compute near data sources
  "placement": { "mode": "smart" },

  // Observability (10% sampling)
  "observability": { "enabled": true, "head_sampling_rate": 0.1 },

  // Environment variables
  "vars": {
    "BETTER_AUTH_URL": "http://localhost:8787"
  },

  // D1 Database
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-db",
      "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
  ],

  // KV Namespace
  "kv_namespaces": [
    { "binding": "KV", "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }
  ],

  // R2 Bucket
  "r2_buckets": [
    { "binding": "R2", "bucket_name": "my-uploads" }
  ],

  // Queues
  "queues": {
    "producers": [{ "binding": "MY_QUEUE", "queue": "my-queue" }]
  },

  // Vectorize
  "vectorize": [
    { "binding": "VECTORIZE", "index_name": "doc-search" }
  ],

  // Workers AI
  "ai": { "binding": "AI" },

  // Workflows
  "workflows": [
    {
      "name": "user-lifecycle",
      "binding": "USER_WORKFLOW",
      "class_name": "UserLifecycleWorkflow"
    }
  ],

  // Durable Objects (for Agents SDK)
  "durable_objects": {
    "bindings": [
      { "name": "CHAT_AGENT", "class_name": "ChatAgent" }
    ]
  },

  // Cron Triggers
  "triggers": {
    "crons": ["0 */6 * * *"]
  },

  // Environment overrides
  "env": {
    "production": {
      "vars": { "BETTER_AUTH_URL": "https://api.myapp.com" },
      "routes": [{ "pattern": "api.myapp.com", "custom_domain": true }],
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "prod-db",
          "database_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"
        }
      ]
    }
  }
}
```

### Key Configuration Options

| Option | Purpose |
|--------|---------|
| `compatibility_date` | Use current date for new projects |
| `compatibility_flags` | `nodejs_compat_v2` enables Node.js built-ins |
| `placement.mode: "smart"` | Auto-locate compute near data sources |
| `observability` | Enable tracing with configurable sampling |

> For Workers, Dynamic Workers, and Containers, see the [Cloudflare Compute](/cloudflare-compute/) decision matrix.

### Legacy wrangler.toml

<details>
<summary>Click to expand wrangler.toml format</summary>

```toml
name = "my-app-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat_v2"]

[placement]
mode = "smart"

[vars]
BETTER_AUTH_URL = "http://localhost:8787"

[[d1_databases]]
binding = "DB"
database_name = "dev-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

[[kv_namespaces]]
binding = "KV"
id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

[[r2_buckets]]
binding = "R2"
bucket_name = "dev-uploads"

[env.production]
vars = { BETTER_AUTH_URL = "https://api.myapp.com" }

[[env.production.d1_databases]]
binding = "DB"
database_name = "prod-db"
database_id = "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"
```

</details>

---

## CI/CD Pipeline

![Cloudflare deploy safety flow](/diagrams/cloudflare-deploy-safety.svg)

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build

      - name: Deploy with Wrangler
        run: wrangler deploy --env production

      # Only if the project met Alchemy triggers:
      # - run: pnpm exec alchemy deploy
```

### Preview Deployments

```yaml
# .github/workflows/preview.yml
name: Preview

on:
  pull_request:
    branches: [main]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build

      - name: Deploy Preview Worker
        id: deploy
        run: wrangler deploy --env preview
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `Preview deployed to: ${{ steps.deploy.outputs.url }}`
            })
```

---

## Production Checklist

### Pre-Deploy

- [ ] All tests passing
- [ ] React Doctor passes for the branch diff
- [ ] Environment variables validated with Zod
- [ ] Infisical environment selected (`dev`, `staging`, or `prod`)
- [ ] Runtime secrets synced to Cloudflare Worker secrets
- [ ] Observability enabled and error alert configured (see /observability/)
- [ ] Database migrations applied
- [ ] Build succeeds locally

### Deploy

- [ ] Deploy to staging first
- [ ] Verify staging works
- [ ] Deploy to production
- [ ] Check wrangler tail for errors

### Post-Deploy

- [ ] Verify all routes work
- [ ] Check auth flows
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify database connections

### Rollback Plan

```bash
# List recent deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback

# Rollback to specific version
wrangler rollback --version <version-id>
```

---

## Troubleshooting

### Common Issues

**"Binding not found"**
- Check wrangler.toml bindings match code
- Ensure correct environment is deployed

**"D1 connection failed"**
- Verify database_id in wrangler.toml
- Check database exists: `wrangler d1 list`

**"Secret not set"**
- Preferred: sync the secret from Infisical to the target Cloudflare Worker/environment
- Deploy-time fallback: `infisical run --env=staging -- pnpm deploy:staging`
- Manual fallback: `wrangler secret put SECRET_NAME`
- Verify: `wrangler secret list`

**"Migration failed"**
- Check SQL syntax in migration file
- Test locally first with `--local` flag

### Debug Commands

```bash
# Check what's deployed
wrangler deployments list

# Check bindings
wrangler whoami

# Test locally with remote data
wrangler dev --remote

# Stream errors only
wrangler tail --status error
```
