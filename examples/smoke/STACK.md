# Application contract

This experimental local reference follows the [upstream law](https://github.com/tristanremy/fenod-tech-stack/blob/UPSTREAM_REVISION/docs/stack-contract.md) except for the bounded overrides below. Read [AGENTS.md](./AGENTS.md) and [README.md](./README.md). Export provenance is recorded in `starter-provenance.json`.

| Area              | Contract                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| Runtime           | Node 24, pinned pnpm and frozen lockfile; macOS/Linux                                                  |
| App               | One package, TanStack Start on Workers; server functions first                                         |
| Database          | Drizzle 0.4x + local D1 binding `DB`; never a database URL                                             |
| Auth              | Better Auth minimal + Drizzle adapter; fresh session at every item boundary                            |
| Ownership         | Session-derived `userId` in every item read/update/delete; no client-supplied owner                    |
| Validation        | Zod for domain inputs from `unknown`; Varlock for fixture config                                       |
| Cache             | Query owns item data; invalidate on mutation and clear on user change                                  |
| UI                | Tailwind v4 + shadcn Radix `new-york`; install official items with `pnpm dlx shadcn@latest add <item>` |
| Lint              | Oxlint + `@shadcn/lint`; layout allowed, variants belong in component definitions                      |
| Format            | Oxfmt; check does not rewrite files                                                                    |
| Bindings          | `pnpm cf-types` uses Varlock/ Wrangler, normalizing only its random header path                        |
| Routes            | `pnpm generate-routes` uses Start's build generator, not a competing router CLI                        |
| Tests             | Unit tests plus Playwright against real local Workers/D1                                               |
| Remote operations | Blocked; no agent deployment, provisioning or remote migrations                                        |

## Explicit experimental overrides

- **Secrets:** upstream Infisical remains the default elsewhere. This app uses only synthetic `test`/loopback Varlock fixtures. No Doppler resolver, real credential or remote config. This does not authorize adoption for real environments.
- **Compiler:** pinned TS7 native preview (`tsgo`) plus TypeScript 5.9 for compiler-API tooling until a coherent stable-toolchain migration is verified.
- **Unit runtime:** Vitest 3.2.x remains pinned by lockfile. Two moderate advisories are tracked for the Workers test-runtime upgrade; do not suppress high/critical audit failures.

## Boundaries and commands

`pnpm ship` verifies config, portable instructions, formatting, lint, types and unit tests. `pnpm build` checks the Worker/client bundle and canaries. `pnpm test:e2e` uses only local synthetic data. Generation and local migration are explicit preparation steps; validation must not silently repair tracked files.

No Hono/oRPC until an external API consumer needs that boundary. No monorepo, Postgres, Redis, organization/role system, realtime, email, billing or resource provisioning in this seed. The existing auth/owned-item feature is the example to extend, not a generic framework.

Promotion requires separate vault and disposable-deployment evidence plus owner approval. No application is migrated automatically. [Release gates](https://github.com/tristanremy/fenod-tech-stack/blob/UPSTREAM_REVISION/plans/010-maintained-starter.md).
