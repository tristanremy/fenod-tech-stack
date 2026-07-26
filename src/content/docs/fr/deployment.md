---
title: "Guide de déploiement"
verified: 2026-06
---

[Disponible en anglais](/fr/deployment/)

![Flux de déploiement Cloudflare sécurisé](/diagrams/cloudflare-deploy-safety-fr.svg)

> Déployez sur Cloudflare avec **Wrangler par défaut**. Alchemy v2 seulement sur triggers. Loi: [Contrat de Stack](/fr/stack-contract/) (EN: [/stack-contract/](/stack-contract/)). Détail canonique: page EN [/deployment/](/deployment/).

## Chemin par defaut

| Outil | Rôle |
|------|---------|
| **Wrangler** | Deploy + dev par defaut |
| **Workers** | Runtime par defaut (static assets inclus) |
| **Infisical** | Source de verite secrets humains/CI + secrets Worker |
| **D1 / R2 / KV** | Bindings data/fichiers/cache |
| **Alchemy v2** | Optionnel sur triggers seulement |

---

## Configuration de l'environnement

Utilisez [Environnements et secrets](/fr/environment-secrets/) as the source guide for Infisical, Cloudflare Worker secrets, and deploy-time environment handling. Short version:

- commitez `infisical.json`, ne commitez jamais `.env`, `.env.local` ni `.dev.vars` ;
- exécutez les commandes locales avec `infisical run --env=dev -- pnpm dev`;
- déployez avec `infisical run --env=staging -- pnpm deploy:staging` ou depuis la CI après récupération des secrets Infisical;
- synchronisez uniquement les secrets runtime vers Cloudflare Workers et gardez la configuration non secrète dans les `vars` Alchemy/Wrangler ;
- validez à la fois l’environnement de déploiement côté Node et les bindings Worker `env` avec Zod.


### Validation de l'environnement avec Zod

Ne faites jamais confiance à `process.env`. Validez au démarrage.

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

### Type des bindings Cloudflare

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

### Accès à l'environnement runtime (Cloudflare Workers)

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

## Default d'Hebergement Cloudflare

Pour les nouveaux projets Fenod, preferer **Cloudflare Workers** comme surface de deploiement, y compris Workers Static Assets pour les sites statiques/docs/contenu. Workers couvre assets statiques, apps framework, APIs, bindings et routing de requetes dans un seul modele.

Utiliser **Cloudflare Pages** quand un projet docs/statique est deja connecte a GitHub et que l'integration Pages reste le chemin de publication le plus simple. Ce Fenod Stack Handbook peut rester sur Pages pour cette raison, mais les nouveaux starters d'app doivent cibler Workers d'abord.

## Default Path: Wrangler

Pour une app ou un site PME typique, utiliser `wrangler.jsonc` et `wrangler deploy`. Un projet avec un Worker, D1, KV, R2, static assets et secrets n'a pas besoin d'un framework IaC.

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

Deployer avec un contexte d'environnement explicite:

```bash
infisical run --env=staging -- wrangler deploy --env staging
infisical run --env=prod -- wrangler deploy --env production
```

Utiliser les environnements Wrangler pour l'isolation simple dev/staging/prod. Garder les secrets dans Infisical, le stockage secret CI, ou Worker secrets; garder uniquement la config non secrete dans `vars`.

## Quand Utiliser Alchemy

Un projet utilise Alchemy v2 au lieu de Wrangler seul quand **une** de ces conditions est vraie:

- 4+ ressources Cloudflare dont le cycle de vie doit etre cree/mis a jour/supprime ensemble;
- 3+ stages isoles au-dela de ce que les environnements Wrangler gerent proprement;
- tests infra-level ou wiring OTel as code;
- plusieurs comptes Cloudflare.

Tout le reste (site/app PME typique: un Worker, un D1, peut-etre un R2): Wrangler seulement.

## Setup Alchemy v2

Alchemy v2 est une reecriture basee sur Effect et est actuellement en beta. Pour un projet client, valider la version courante d'Alchemy et les docs au moment de l'adoption. Ne pas utiliser les anciens exemples de package legacy ou d'initializer v1 phase/run pour les nouveaux projets. Installer le package courant:

```bash
pnpm add -D alchemy effect
```

Forme minimale des docs Alchemy v2:

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

Pour les credentials Alchemy locaux, utiliser `alchemy login`; Alchemy stocke les profils dans `~/.alchemy/profiles.json`. Ne pas exporter `CLOUDFLARE_API_TOKEN` pour le travail Alchemy local.

Deployer seulement apres la quality gate normale:

```bash
pnpm check
pnpm exec alchemy deploy
```

Detruire les ressources uniquement depuis une session explicitement approuvee:

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

| Option | Rôle |
|--------|---------|
| `compatibility_date` | Utilisez current date for new projects |
| `compatibility_flags` | `nodejs_compat_v2` enables Node.js built-ins |
| `placement.mode: "smart"` | Auto-locate compute near data sources |
| `observability` | Enable tracing with configurable sampling |

> For Workers, Dynamic Workers, and Containers, see the [Cloudflare Compute](/fr/cloudflare-compute/) decision matrix.

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

      # Seulement si triggers Alchemy:
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
- [ ] Runtime secrets synced to Cloudflare Workers or injected during Alchemy deploy
- [ ] Observability enabled and error alert configured (see /fr/observability/)
- [ ] Database migrations applied
- [ ] Build succeeds locally

### Deploy

- [ ] Déployer en staging first
- [ ] Verify staging works
- [ ] Déployer en production
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
