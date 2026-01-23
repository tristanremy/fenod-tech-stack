# Deployment Guide

> Deploy to Cloudflare with Alchemy, manage environments, and validate configuration.

## Stack

| Tool | Purpose |
|------|---------|
| **Alchemy** | Infrastructure-as-code for Cloudflare |
| **Wrangler** | Cloudflare CLI for dev/debug |
| **D1** | SQLite database at the edge |
| **R2** | Object storage |
| **KV** | Key-value store |

---

## Environment Configuration

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

## Alchemy Setup

Alchemy is IaC for Cloudflare. Define infrastructure in TypeScript.

### Install

```bash
pnpm add -D alchemy-framework
```

### Configuration

```ts
// alchemy.run.ts
import alchemy from 'alchemy-framework'

export default alchemy({
  name: 'my-app',
  phase: process.env.ALCHEMY_PHASE ?? 'development',

  async run({ phase }) {
    const isProduction = phase === 'production'

    // D1 Database
    const database = await alchemy.D1Database('main-db', {
      name: isProduction ? 'prod-db' : 'dev-db',
    })

    // KV Namespace
    const kv = await alchemy.KVNamespace('cache', {
      name: isProduction ? 'prod-cache' : 'dev-cache',
    })

    // R2 Bucket
    const bucket = await alchemy.R2Bucket('uploads', {
      name: isProduction ? 'prod-uploads' : 'dev-uploads',
    })

    // Worker
    const worker = await alchemy.Worker('api', {
      name: isProduction ? 'prod-api' : 'dev-api',
      main: './dist/worker.js',
      compatibilityDate: '2024-01-01',
      bindings: {
        DB: database,
        KV: kv,
        R2: bucket,
        BETTER_AUTH_SECRET: alchemy.secret('BETTER_AUTH_SECRET'),
        BETTER_AUTH_URL: isProduction
          ? 'https://api.myapp.com'
          : 'http://localhost:8787',
      },
    })

    // Pages (frontend)
    const pages = await alchemy.Pages('web', {
      name: isProduction ? 'prod-web' : 'dev-web',
      projectName: 'my-app-web',
      buildCommand: 'pnpm build',
      buildOutputDirectory: './dist',
    })

    return { database, kv, bucket, worker, pages }
  },
})
```

### Secrets Management

```ts
// Secrets are encrypted and stored in Cloudflare
const worker = await alchemy.Worker('api', {
  bindings: {
    // Reference secrets by name - value comes from Cloudflare dashboard or CLI
    BETTER_AUTH_SECRET: alchemy.secret('BETTER_AUTH_SECRET'),
    GOOGLE_CLIENT_SECRET: alchemy.secret('GOOGLE_CLIENT_SECRET'),
  },
})
```

Set secrets via CLI:

```bash
# Set secret for production
wrangler secret put BETTER_AUTH_SECRET --env production

# Set secret for development
wrangler secret put BETTER_AUTH_SECRET --env development
```

### Deploy Commands

```bash
# Deploy to development
ALCHEMY_PHASE=development pnpm alchemy deploy

# Deploy to production
ALCHEMY_PHASE=production pnpm alchemy deploy

# Destroy resources (careful!)
ALCHEMY_PHASE=development pnpm alchemy destroy
```

---

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
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:run
      - run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build

      # Option A: Wrangler
      - name: Deploy with Wrangler
        run: wrangler deploy --env production

      # Option B: Alchemy
      - name: Deploy with Alchemy
        run: ALCHEMY_PHASE=production pnpm alchemy deploy
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
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build

      - name: Deploy Preview
        id: deploy
        run: |
          OUTPUT=$(wrangler pages deploy ./dist --project-name my-app --branch ${{ github.head_ref }})
          echo "url=$(echo $OUTPUT | grep -oP 'https://[^\s]+')" >> $GITHUB_OUTPUT
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
- [ ] Environment variables validated with Zod
- [ ] Secrets set in Cloudflare dashboard
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
- Set via: `wrangler secret put SECRET_NAME`
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
