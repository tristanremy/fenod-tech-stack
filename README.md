<p align="center">
  <img alt="Fenod" src="https://fenod.fr/favicon.svg" width="80">
</p>

# Fenod stack

Opinionated defaults for building full-stack TypeScript products on Cloudflare Workers.

**Start small. Keep the platform boring. Give agents context, not production authority.**

## The short version

| Need | Default |
| --- | --- |
| App | TanStack Start on Cloudflare Workers |
| Data | Drizzle + D1 |
| Auth | Better Auth |
| UI | Tailwind v4 + shadcn/ui; install requested official components/blocks with `pnpm dlx shadcn@latest add <item>` |
| API | Start server functions first; Hono + oRPC when a real API boundary exists |
| Files / async work | R2 / Queues / Workflows |
| AI | TanStack AI + Cloudflare AI Gateway |
| Quality | Oxlint + @shadcn/lint + Oxfmt + TypeScript 7 + Vitest + Playwright when needed |
| Secrets | Infisical + Worker secrets |
| Deploy | Git push → protected CI → Workers |

## How the pieces fit

```mermaid
flowchart LR
  U[Browser] --> S[TanStack Start]
  S --> A[Server functions]
  A --> DB[(D1 + Drizzle)]
  A --> AU[Better Auth]
  A --> O[R2]
  A --> Q[Queues / Workflows]
  A --> AI[TanStack AI]
  AI --> G[Cloudflare AI Gateway]
  G --> M[Approved model providers]
  CI[Protected CI] --> S
  CI --> V[Lint · types · tests · build]
  CI --> D[Workers deploy]
```

## Try the application reference

The living reference is intentionally one package, not a starter monorepo.

**Still experimental:** local auth/owned CRUD, fixture-only Varlock, immutable export and clean-room browser verification are implemented. Doppler, deployed secrets/recovery and production operations are not validated. See the [September audit](plans/009-agent-first-audit.md) and [starter plan](plans/010-maintained-starter.md).

Export only committed files from an exact revision; never copy a working tree:

```bash
revision=$(git rev-parse HEAD)
node scripts/export-starter.mjs "$revision" ../my-app
cd ../my-app
pnpm install --frozen-lockfile
pnpm cf-types
pnpm ship
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

The export refuses overwrite and unsafe Git entries, records commit/tree provenance and replaces upstream links with that immutable commit. It needs only Node 24, pinned pnpm, Git and standard `tar` on macOS/Linux. No vault account, Cloudflare credential or local env file is needed. Add Hono + oRPC only for a real API boundary ([recipe](docs/recipes.md)). Remote scripts fail closed until separately approved S4/S5 work.

```mermaid
flowchart TD
  A[Open examples/smoke] --> B[Validate fixture config + types]
  B --> C[Apply local D1 migrations]
  C --> D[Run ship gate]
  D --> E[Exercise owned-item flow]
  E --> F{Real boundary or scale trigger?}
  F -- No --> E
  F -- API consumers --> G[Add Hono + oRPC]
  F -- Shared deployables --> H[Add monorepo / Alchemy]
  F -- Shared live state --> I[Consider Durable Object]
```

For a content or marketing site, use the [Astro recipe](docs/astro.md) and [standalone Astro reference](examples/astro/README.md).

## UI rule

When you want shadcn, use the real item, not a similar implementation:

```bash
pnpm dlx shadcn@latest add <item>
```

This applies to primitives and blocks, including the default sidebar. Customize after it is installed so future shadcn updates remain easy.

The smoke reference also runs **`@shadcn/lint` through Oxlint**. Its `no-restyle` policy keeps component variants authoritative while allowing page layout. See the [UI lint recipe](docs/recipes.md#verify-design-system-usage).

## What we deliberately do not start with

- no day-one monorepo or Alchemy;
- no Redis, Prisma, Express, tRPC, or new Pages projects;
- no repository/hexagonal layers without real pain;
- no production deploys, migrations, DNS, or secrets from agent sessions.

Grow only when the trigger is real. See [the Stack Contract](docs/stack-contract.md).

## Humans and agents

Humans: start with this README, then [examples/README.md](examples/README.md) and [examples/smoke/STACK.md](examples/smoke/STACK.md).

Agents: start with [AGENTS.md](AGENTS.md), then use [agent-context.json](agent-context.json) or [llms.txt](llms.txt) to route by task. Read [llms-full.txt](llms-full.txt) only when deeper context is needed. Agent operation rules live in [docs/agent-factory.md](docs/agent-factory.md).

## Checks

```bash
pnpm check       # read-only: fails on stale generated context
pnpm test        # generator determinism and negative checks
pnpm --dir examples/smoke ship
pnpm --dir examples/astro ship
# Higher-risk smoke changes:
pnpm --dir examples/smoke cf-types
pnpm --dir examples/smoke build
```

After editing agent-context sources, run `pnpm llms:build` and review the generated diff before checking. The [audit](plans/009-agent-first-audit.md) separates verified changes from pending migrations; [agent evaluations](docs/agent-evals.md) describes the bounded Jev pilot.

Law: [docs/stack-contract.md](docs/stack-contract.md). Security: [docs/security-model.md](docs/security-model.md).
