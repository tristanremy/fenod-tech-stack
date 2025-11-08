# Infrastructure as Code

Automate Cloudflare infrastructure provisioning and deployments for the Fenod Stack using Terraform, Wrangler, and CI/CD pipelines.

**Last Updated:** November 2025

---

## Table of Contents

- [Overview](#overview)
- [Wrangler Configuration](#wrangler-configuration)
- [Terraform Examples](#terraform-examples)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Deployment Strategies](#deployment-strategies)
- [Secrets Management](#secrets-management)
- [Multi-Environment Setup](#multi-environment-setup)

---

## Overview

### Tools Used

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Wrangler** | Deploy Workers, manage D1/R2 | Primary deployment tool |
| **Terraform** | Provision Cloudflare resources | Infrastructure management |
| **GitHub Actions** | CI/CD automation | Automated deployments |
| **Alchemy** | Simplified Cloudflare deployments | Alternative to Wrangler |

### Recommended Approach

1. **Development**: Use Wrangler CLI locally
2. **Infrastructure**: Use Terraform for resource provisioning
3. **CI/CD**: Use GitHub Actions for automated deployments
4. **Secrets**: Use Cloudflare Secrets + GitHub Secrets

---

## Wrangler Configuration

### Basic wrangler.toml

```toml
# wrangler.toml - Main configuration file
name = "my-fenod-app"
main = "src/index.ts"
compatibility_date = "2025-11-08"
compatibility_flags = ["nodejs_compat"]

# Account ID (get from Cloudflare dashboard)
account_id = "your-account-id"

# Worker settings
workers_dev = true
route = { pattern = "example.com/*", zone_name = "example.com" }

# Build configuration
[build]
command = "npm run build"

[build.upload]
format = "service-worker"

# Environment variables (non-sensitive)
[vars]
ENVIRONMENT = "production"
API_VERSION = "v1"

# D1 Database bindings
[[d1_databases]]
binding = "DB"
database_name = "prod-db"
database_id = "your-database-id"

# R2 Storage bindings
[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "prod-uploads"

# KV Namespace bindings
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-id"

# Durable Objects (if needed)
[[durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiter"
script_name = "rate-limiter"

# Service bindings (for microservices)
[[services]]
binding = "AUTH_SERVICE"
service = "auth-worker"
environment = "production"

# Analytics Engine (optional)
[[analytics_engine_datasets]]
binding = "ANALYTICS"

# Observability
[observability]
enabled = true
head_sampling_rate = 0.1  # Sample 10% of requests
```

### Multi-Environment Configuration

```toml
# wrangler.toml - Base configuration
name = "my-app"
main = "src/index.ts"
compatibility_date = "2025-11-08"

# Development environment
[env.development]
name = "my-app-dev"
route = { pattern = "dev.example.com/*", zone_name = "example.com" }

[env.development.vars]
ENVIRONMENT = "development"
API_URL = "https://api-dev.example.com"

[[env.development.d1_databases]]
binding = "DB"
database_name = "dev-db"
database_id = "dev-database-id"

# Staging environment
[env.staging]
name = "my-app-staging"
route = { pattern = "staging.example.com/*", zone_name = "example.com" }

[env.staging.vars]
ENVIRONMENT = "staging"
API_URL = "https://api-staging.example.com"

[[env.staging.d1_databases]]
binding = "DB"
database_name = "staging-db"
database_id = "staging-database-id"

# Production environment
[env.production]
name = "my-app-prod"
route = { pattern = "example.com/*", zone_name = "example.com" }

[env.production.vars]
ENVIRONMENT = "production"
API_URL = "https://api.example.com"

[[env.production.d1_databases]]
binding = "DB"
database_name = "prod-db"
database_id = "prod-database-id"
```

### Wrangler Commands

```bash
# Development
wrangler dev                      # Start local dev server
wrangler dev --remote             # Test against remote services

# Deployment
wrangler deploy                   # Deploy to default environment
wrangler deploy --env staging     # Deploy to staging
wrangler deploy --env production  # Deploy to production

# Database management
wrangler d1 create my-db                        # Create D1 database
wrangler d1 list                                # List databases
wrangler d1 execute my-db --file=migration.sql  # Run migration
wrangler d1 execute my-db --command="SELECT * FROM users"

# R2 management
wrangler r2 bucket create my-bucket      # Create R2 bucket
wrangler r2 bucket list                  # List buckets
wrangler r2 object put my-bucket/file.txt --file=./file.txt

# Secrets management
wrangler secret put API_KEY              # Add secret (interactive)
wrangler secret list                     # List secrets
wrangler secret delete API_KEY           # Delete secret

# KV management
wrangler kv:namespace create CACHE       # Create KV namespace
wrangler kv:key put --namespace-id=xxx "key" "value"
wrangler kv:key get --namespace-id=xxx "key"

# Logs
wrangler tail                            # Stream logs
wrangler tail --format pretty            # Formatted logs
wrangler tail --env production           # Production logs

# Testing
wrangler pages dev ./dist                # Test Pages locally
```

---

## Terraform Examples

### Provider Setup

```hcl
# terraform/providers.tf
terraform {
  required_version = ">= 1.6"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  # Remote state (recommended for teams)
  backend "s3" {
    bucket = "terraform-state"
    key    = "fenod-stack/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
```

### Variables

```hcl
# terraform/variables.tf
variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "fenod-app"
}
```

### D1 Database

```hcl
# terraform/d1.tf
resource "cloudflare_d1_database" "main" {
  account_id = var.cloudflare_account_id
  name       = "${var.project_name}-${var.environment}-db"
}

output "d1_database_id" {
  value       = cloudflare_d1_database.main.id
  description = "D1 database ID"
}
```

### R2 Bucket

```hcl
# terraform/r2.tf
resource "cloudflare_r2_bucket" "uploads" {
  account_id = var.cloudflare_account_id
  name       = "${var.project_name}-${var.environment}-uploads"
  location   = "auto"  # Automatic location selection
}

resource "cloudflare_r2_bucket" "backups" {
  account_id = var.cloudflare_account_id
  name       = "${var.project_name}-${var.environment}-backups"
  location   = "auto"
}

output "r2_uploads_bucket" {
  value       = cloudflare_r2_bucket.uploads.name
  description = "R2 uploads bucket name"
}
```

### KV Namespace

```hcl
# terraform/kv.tf
resource "cloudflare_workers_kv_namespace" "cache" {
  account_id = var.cloudflare_account_id
  title      = "${var.project_name}-${var.environment}-cache"
}

resource "cloudflare_workers_kv_namespace" "sessions" {
  account_id = var.cloudflare_account_id
  title      = "${var.project_name}-${var.environment}-sessions"
}

output "kv_cache_id" {
  value       = cloudflare_workers_kv_namespace.cache.id
  description = "KV cache namespace ID"
}
```

### Worker Script

```hcl
# terraform/worker.tf
resource "cloudflare_worker_script" "api" {
  account_id = var.cloudflare_account_id
  name       = "${var.project_name}-${var.environment}-api"
  content    = file("${path.module}/../dist/index.js")

  # D1 binding
  d1_database_binding {
    name        = "DB"
    database_id = cloudflare_d1_database.main.id
  }

  # R2 binding
  r2_bucket_binding {
    name        = "UPLOADS"
    bucket_name = cloudflare_r2_bucket.uploads.name
  }

  # KV binding
  kv_namespace_binding {
    name         = "CACHE"
    namespace_id = cloudflare_workers_kv_namespace.cache.id
  }

  # Environment variables
  plain_text_binding {
    name = "ENVIRONMENT"
    text = var.environment
  }

  # Secrets (reference existing secrets)
  secret_text_binding {
    name = "API_KEY"
    text = var.api_key
  }
}

resource "cloudflare_worker_route" "api" {
  zone_id     = var.cloudflare_zone_id
  pattern     = "api.example.com/*"
  script_name = cloudflare_worker_script.api.name
}
```

### Pages Project

```hcl
# terraform/pages.tf
resource "cloudflare_pages_project" "frontend" {
  account_id        = var.cloudflare_account_id
  name              = "${var.project_name}-${var.environment}-web"
  production_branch = "main"

  build_config {
    build_command       = "npm run build"
    destination_dir     = "dist"
    root_dir            = "apps/web"
    web_analytics_tag   = cloudflare_web_analytics_site.main.id
    web_analytics_token = cloudflare_web_analytics_site.main.token
  }

  deployment_configs {
    production {
      environment_variables = {
        NODE_VERSION = "20"
        API_URL      = "https://api.example.com"
      }
    }

    preview {
      environment_variables = {
        NODE_VERSION = "20"
        API_URL      = "https://api-staging.example.com"
      }
    }
  }
}

# Custom domain
resource "cloudflare_pages_domain" "frontend" {
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.frontend.name
  domain       = "example.com"
}
```

### DNS Records

```hcl
# terraform/dns.tf
resource "cloudflare_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = "example.com"
  value   = cloudflare_pages_project.frontend.subdomain
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  value   = "workers.cloudflare.com"  # Worker route
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = "example.com"
  type    = "CNAME"
  proxied = true
}
```

### Complete Example

```hcl
# terraform/main.tf
module "cloudflare_infrastructure" {
  source = "./modules/fenod-stack"

  cloudflare_account_id = var.cloudflare_account_id
  cloudflare_zone_id    = var.cloudflare_zone_id
  project_name          = "my-saas"
  environment           = "production"

  # Enable/disable resources
  enable_d1       = true
  enable_r2       = true
  enable_kv       = true
  enable_workers  = true
  enable_pages    = true
  enable_analytics = true
}

output "infrastructure" {
  value = {
    d1_database_id    = module.cloudflare_infrastructure.d1_database_id
    r2_bucket_name    = module.cloudflare_infrastructure.r2_bucket_name
    kv_namespace_id   = module.cloudflare_infrastructure.kv_namespace_id
    worker_url        = module.cloudflare_infrastructure.worker_url
    pages_url         = module.cloudflare_infrastructure.pages_url
  }
  description = "Infrastructure outputs"
}
```

### Terraform Commands

```bash
# Initialize
terraform init

# Plan changes
terraform plan -var-file="production.tfvars"

# Apply changes
terraform apply -var-file="production.tfvars"

# Destroy infrastructure
terraform destroy -var-file="production.tfvars"

# Show current state
terraform show

# Output values
terraform output
```

---

## GitHub Actions Workflows

### Basic Deployment Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy to Cloudflare Workers

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production
```

### Multi-Environment Workflow

```yaml
# .github/workflows/deploy-multi-env.yml
name: Multi-Environment Deploy

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches: [main, develop]

jobs:
  # Deploy to staging on develop branch
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install & Build
        run: |
          npm ci
          npm run build

      - name: Deploy to Staging
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env staging

  # Deploy to production on main branch
  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install & Build
        run: |
          npm ci
          npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Deploy to Production
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production

      - name: Create Sentry release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
        with:
          environment: production
```

### Database Migration Workflow

```yaml
# .github/workflows/migrate-database.yml
name: Database Migrations

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to migrate'
        required: true
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  migrate:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Generate migration
        run: npm run db:generate

      - name: Run migration
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: d1 execute ${{ secrets.D1_DATABASE_NAME }} --env ${{ inputs.environment }} --file=./db/migrations/latest.sql

      - name: Verify migration
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: d1 execute ${{ secrets.D1_DATABASE_NAME }} --env ${{ inputs.environment }} --command="SELECT * FROM _drizzle_migrations ORDER BY created_at DESC LIMIT 1"
```

### Preview Deployments (PRs)

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install & Build
        run: |
          npm ci
          npm run build

      - name: Deploy Preview
        id: deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env preview-${{ github.event.pull_request.number }}

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed to: https://preview-${{ github.event.pull_request.number }}.example.workers.dev'
            })
```

### Terraform Workflow

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'
  pull_request:
    branches: [main]
    paths:
      - 'terraform/**'

jobs:
  terraform:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.6.0

      - name: Terraform Init
        working-directory: ./terraform
        run: terraform init

      - name: Terraform Format
        working-directory: ./terraform
        run: terraform fmt -check

      - name: Terraform Plan
        working-directory: ./terraform
        env:
          TF_VAR_cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          TF_VAR_cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          TF_VAR_cloudflare_zone_id: ${{ secrets.CLOUDFLARE_ZONE_ID }}
        run: terraform plan

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        working-directory: ./terraform
        env:
          TF_VAR_cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          TF_VAR_cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          TF_VAR_cloudflare_zone_id: ${{ secrets.CLOUDFLARE_ZONE_ID }}
        run: terraform apply -auto-approve
```

---

## Deployment Strategies

### Blue-Green Deployment

```yaml
# Deploy new version alongside old version
name: Blue-Green Deployment

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # Deploy to "green" environment
      - name: Deploy Green
        run: wrangler deploy --env green

      # Run smoke tests
      - name: Smoke Tests
        run: npm run test:smoke -- --url https://green.example.com

      # Switch traffic to green
      - name: Switch Traffic
        run: |
          # Update DNS/routing to point to green
          wrangler deploy --env production

      # Keep blue as rollback option
      - name: Tag Blue for Rollback
        run: |
          git tag "rollback-$(date +%Y%m%d-%H%M%S)"
          git push --tags
```

### Canary Deployment

```typescript
// Route percentage of traffic to new version
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Route 10% of traffic to canary
    const canaryPercent = 10
    const useCanary = Math.random() * 100 < canaryPercent

    if (useCanary) {
      return env.CANARY_SERVICE.fetch(request)
    } else {
      return env.STABLE_SERVICE.fetch(request)
    }
  }
}
```

### Rolling Deployment

```bash
# Deploy gradually across regions
for region in US EU APAC; do
  echo "Deploying to $region..."
  wrangler deploy --env "prod-$region"

  # Wait and monitor
  sleep 300

  # Check error rates
  if check_errors "$region"; then
    echo "Deployment to $region successful"
  else
    echo "Rolling back $region"
    wrangler rollback --env "prod-$region"
    exit 1
  fi
done
```

---

## Secrets Management

### Setting Secrets via Wrangler

```bash
# Interactive
wrangler secret put DATABASE_URL

# From file
echo "my-secret-value" | wrangler secret put API_KEY

# From environment variable
echo $SECRET_VALUE | wrangler secret put SECRET_KEY
```

### GitHub Actions Secrets

```yaml
# Access GitHub secrets in workflows
steps:
  - name: Deploy
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    run: wrangler deploy
```

### Terraform Secrets

```hcl
# Use variables for secrets
resource "cloudflare_worker_script" "api" {
  secret_text_binding {
    name = "DATABASE_URL"
    text = var.database_url  # Pass via tfvars
  }
}
```

---

## Multi-Environment Setup

### Directory Structure

```
.
├── wrangler.toml            # Worker config
├── terraform/
│   ├── environments/
│   │   ├── dev.tfvars
│   │   ├── staging.tfvars
│   │   └── production.tfvars
│   └── main.tf
├── .github/
│   └── workflows/
│       ├── deploy-dev.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
└── environments/
    ├── dev.env
    ├── staging.env
    └── production.env
```

### Environment Configuration

```bash
# environments/production.env
ENVIRONMENT=production
API_URL=https://api.example.com
LOG_LEVEL=error
ENABLE_ANALYTICS=true

# environments/staging.env
ENVIRONMENT=staging
API_URL=https://api-staging.example.com
LOG_LEVEL=debug
ENABLE_ANALYTICS=false
```

---

## Best Practices

### 1. **Version Control Everything**

```bash
# .gitignore
.dev.vars
.env.local
*.tfstate
*.tfstate.backup
.terraform/
node_modules/
dist/
```

### 2. **Use Environment-Specific Configs**

Don't hardcode values:
```typescript
// ❌ Bad
const apiUrl = "https://api.example.com"

// ✅ Good
const apiUrl = env.API_URL
```

### 3. **Automate Testing Before Deployment**

```yaml
- name: Run Tests
  run: |
    npm run test
    npm run test:e2e
    npm run lint
```

### 4. **Tag Releases**

```bash
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

### 5. **Document Infrastructure Changes**

Update `STACK_CHANGELOG.md` when modifying infrastructure.

---

## Troubleshooting

### Common Issues

**Terraform state conflicts:**
```bash
# Force unlock if stuck
terraform force-unlock <LOCK_ID>
```

**Wrangler deployment fails:**
```bash
# Clear cache and retry
rm -rf node_modules/.cache
wrangler deploy
```

**GitHub Actions timeout:**
```yaml
# Increase timeout
jobs:
  deploy:
    timeout-minutes: 30  # Default is 360
```

---

## Next Steps

- [Observability Guide](observability.md) - Monitoring and logging
- [Cost Calculator](cost-calculator.md) - Estimate infrastructure costs
- [Troubleshooting](troubleshooting.md) - Common deployment issues

---

**Last Updated:** November 2025
