# Local Development Setup

Complete guide for setting up a local development environment for the Fenod Stack.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Docker Compose Setup](#docker-compose-setup)
- [Database Options](#database-options)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Testing Locally](#testing-locally)
- [Common Tasks](#common-tasks)

---

## Prerequisites

### Required Tools

```bash
# Node.js 20+ (LTS recommended)
node --version  # Should be v20.x or higher

# Package manager (choose one)
bun --version   # Recommended for speed
npm --version
pnpm --version

# Git
git --version

# Cloudflare Wrangler
bunx wrangler --version  # or npx wrangler --version
```

### Optional but Recommended

```bash
# Docker (for local databases)
docker --version
docker-compose --version

# VS Code with extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Biome (if using Ultracite)
```

---

## Quick Start

### 1. Bootstrap Project

```bash
# Create new project with create-better-t-stack
bun create better-t-stack@latest my-app

# Interactive selections:
# - Frontend: React + TanStack Start
# - Backend: Hono
# - API: ORPC
# - Database: PostgreSQL (for local dev) or SQLite (for D1)
# - ORM: Drizzle
# - Auth: Better Auth
# - Styling: Tailwind CSS
# - Add-ons: Ultracite

cd my-app
```

### 2. Install Dependencies

```bash
bun install  # or npm install / pnpm install
```

### 3. Setup Environment

```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your values
vim .env.local
```

### 4. Start Development Server

```bash
# Start all services
bun run dev

# Or start individually
bun run dev:db      # Start database (Docker)
bun run dev:server  # Start Wrangler dev server
bun run dev:client  # Start Vite dev server
```

---

## Docker Compose Setup

For local development, we recommend using Docker Compose to run PostgreSQL (simpler than managing Cloudflare D1 locally).

### docker-compose.yml

Create this file in your project root:

```yaml
version: '3.8'

services:
  # PostgreSQL database for local development
  postgres:
    image: postgres:16-alpine
    container_name: fenod-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: fenod
      POSTGRES_PASSWORD: fenod_dev_password
      POSTGRES_DB: fenod_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fenod"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis (optional - for caching/sessions)
  redis:
    image: redis:7-alpine
    container_name: fenod-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Mailhog (optional - for email testing)
  mailhog:
    image: mailhog/mailhog:latest
    container_name: fenod-mail
    restart: unless-stopped
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    environment:
      MH_STORAGE: maildir
      MH_MAILDIR_PATH: /maildir
    volumes:
      - mailhog_data:/maildir

volumes:
  postgres_data:
  redis_data:
  mailhog_data:
```

### Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f postgres

# Stop services
docker-compose down

# Stop and remove data
docker-compose down -v
```

### Verify Services

```bash
# Check PostgreSQL
docker-compose exec postgres psql -U fenod -d fenod_dev -c "SELECT version();"

# Check Redis
docker-compose exec redis redis-cli ping

# View Mailhog UI
open http://localhost:8025
```

---

## Database Options

### Option 1: Local PostgreSQL (Docker) - Recommended for Development

**Pros:**
- Full PostgreSQL features
- Better for development/testing
- Easier to inspect and debug
- Works offline

**Setup:**

```bash
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Configure Drizzle for PostgreSQL
# drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './db/schema/*.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

```bash
# 3. Set environment variable
echo "DATABASE_URL=postgresql://fenod:fenod_dev_password@localhost:5432/fenod_dev" >> .env.local

# 4. Generate and run migrations
bun run db:generate
bun run db:migrate
```

### Option 2: Cloudflare D1 (Local Mode)

**Pros:**
- Matches production environment exactly
- SQLite-based (lightweight)

**Cons:**
- Requires Wrangler running
- Limited tooling compared to PostgreSQL

**Setup:**

```bash
# 1. Create D1 database locally
bunx wrangler d1 create my-db --local

# 2. Configure wrangler.toml
cat >> wrangler.toml <<EOF
[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "local-db-id"
EOF

# 3. Configure Drizzle for SQLite
# drizzle.config.ts
export default defineConfig({
  schema: './db/schema/*.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  driver: 'd1-http', // For remote access
})

# 4. Run migrations
bunx wrangler d1 execute my-db --local --file=./db/migrations/0000_init.sql
```

### Option 3: SQLite File (Simplest)

**Pros:**
- Zero configuration
- Perfect for prototyping

**Cons:**
- Doesn't match D1 exactly
- Limited for team development

**Setup:**

```bash
# 1. Set environment variable
echo "DATABASE_URL=file:./local.db" >> .env.local

# 2. Configure Drizzle
# drizzle.config.ts
export default defineConfig({
  schema: './db/schema/*.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './local.db',
  },
})

# 3. Run migrations
bun run db:migrate
```

---

## Environment Variables

### .env.local Template

```bash
# Database
DATABASE_URL="postgresql://fenod:fenod_dev_password@localhost:5432/fenod_dev"

# Cloudflare (for wrangler dev)
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_TOKEN="your-api-token"

# Auth
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Email (development)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@localhost"

# Feature Flags
ENABLE_SIGNUP="true"
ENABLE_OAUTH="true"

# API Keys (for third-party services)
STRIPE_SECRET_KEY="sk_test_..."
OPENAI_API_KEY="sk-..."
```

### .dev.vars (for Wrangler)

Wrangler uses `.dev.vars` for local secrets:

```bash
# .dev.vars (don't commit this!)
DATABASE_URL=postgresql://fenod:fenod_dev_password@localhost:5432/fenod_dev
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
```

### Loading Environment Variables

```tsx
// vite.config.ts
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    define: {
      'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
    },
  }
})
```

---

## Development Workflow

### Daily Workflow

```bash
# 1. Start database
docker-compose up -d postgres

# 2. Start development server
bun run dev

# 3. Open browser
open http://localhost:3000

# 4. Make changes (hot reload enabled)

# 5. Run linter/formatter (if using Ultracite)
bun run lint
bun run format

# 6. Commit changes
git add .
git commit -m "feat: add customer list"

# 7. Stop services when done
docker-compose down
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"bun run dev:db\" \"bun run dev:server\"",
    "dev:db": "docker-compose up -d postgres",
    "dev:server": "wrangler dev",
    "dev:client": "vite",

    "build": "vite build",
    "preview": "wrangler dev --remote",

    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx db/seed.ts",

    "lint": "biome check .",
    "format": "biome format --write .",

    "test": "vitest",
    "test:e2e": "playwright test",

    "deploy": "wrangler deploy"
  }
}
```

---

## Testing Locally

### Unit Tests (Vitest)

```bash
# Install Vitest
bun add -D vitest @testing-library/react @testing-library/jest-dom

# Run tests
bun run test

# Watch mode
bun run test --watch

# Coverage
bun run test --coverage
```

Example test:

```tsx
// app/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('handles conditional classes', () => {
    expect(cn('px-4', false && 'hidden')).toBe('px-4')
  })
})
```

### E2E Tests (Playwright)

```bash
# Install Playwright
bun add -D @playwright/test
bunx playwright install

# Run E2E tests
bun run test:e2e

# Run with UI
bunx playwright test --ui
```

Example E2E test:

```tsx
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('user can sign in', async ({ page }) => {
  await page.goto('http://localhost:3000')

  await page.click('text=Sign In')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.locator('text=Welcome')).toBeVisible()
})
```

### API Testing

```bash
# Install REST Client (Thunder Client extension for VS Code)
# Or use curl/httpie

# Test API endpoint
curl http://localhost:8787/api/orpc/customers.list \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

---

## Common Tasks

### Database Management

```bash
# Open Drizzle Studio (visual database browser)
bun run db:studio
open http://localhost:4983

# Reset database
docker-compose down -v
docker-compose up -d postgres
bun run db:migrate

# Seed database with test data
bun run db:seed

# Backup database
docker-compose exec postgres pg_dump -U fenod fenod_dev > backup.sql

# Restore database
docker-compose exec -T postgres psql -U fenod fenod_dev < backup.sql
```

### View Logs

```bash
# Wrangler logs
bunx wrangler tail

# Docker logs
docker-compose logs -f postgres

# Combined logs
docker-compose logs -f
```

### Inspect Database

```bash
# PostgreSQL CLI
docker-compose exec postgres psql -U fenod -d fenod_dev

# Run SQL
\dt  # List tables
\d customers  # Describe table
SELECT * FROM customers LIMIT 5;

# Exit
\q
```

### Clear Caches

```bash
# Clear Node modules cache
rm -rf node_modules .cache

# Clear build cache
rm -rf dist .vinxi .output

# Clear Docker volumes
docker-compose down -v

# Reinstall everything
bun install
```

---

## VS Code Configuration

### .vscode/settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit",
    "source.fixAll": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### .vscode/extensions.json

```json
{
  "recommendations": [
    "biomejs.biome",
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "cloudflare.vscode-cloudflare-workers",
    "ms-playwright.playwright"
  ]
}
```

---

## Debugging

### Debug Wrangler in VS Code

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Wrangler Dev",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "bunx",
      "runtimeArgs": ["wrangler", "dev", "--local"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Debug React in Chrome

1. Start dev server: `bun run dev`
2. Open Chrome DevTools
3. Sources tab → Add folder to workspace
4. Set breakpoints in source files
5. Refresh page

---

## Performance Profiling

### Measure Build Time

```bash
# Analyze bundle size
bunx vite-bundle-visualizer

# Check build time
time bun run build
```

### Profile Database Queries

```bash
# Enable query logging in PostgreSQL
docker-compose exec postgres psql -U fenod -d fenod_dev \
  -c "ALTER DATABASE fenod_dev SET log_statement = 'all';"

# View slow queries
docker-compose logs postgres | grep "duration:"
```

---

## Next Steps

- **[Development Strategy](development-strategy.md)** - UI-first workflow
- **[Architecture](architecture.md)** - System design and diagrams
- **[Troubleshooting](troubleshooting.md)** - Common issues
- **[Architecture Decisions](decisions/)** - Why we chose each technology

---

**Last Updated:** November 2025
