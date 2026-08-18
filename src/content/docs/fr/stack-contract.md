---
title: "Contrat de Stack"
description: "Loi des defaults Fenod. Les autres pages expliquent; celle-ci tranche les conflits."
verified: 2026-06
---

Cette page est la **loi**. Si une autre page est plus longue ou plus detaillee, celle-ci gagne sauf override explicite dans un `STACK.md` / AGENTS de projet.

> Node 24 + pnpm. TanStack Start + Workers. Drizzle/D1 + Better Auth. Tailwind v4 + shadcn. Wrangler. Oxlint + Oxfmt. Infisical + secrets Worker. Hono/ORPC seulement si une frontiere API le demande. Plus petite gate. Pas de secrets dans git, pas d'autorite prod pour les agents, pas de thrash de stack.

L'anglais est la Source Locale des contrats. Cette page FR est une commodite humaine, pas une seconde loi. En cas de derive: [Stack Contract EN](/stack-contract/).

## Autorite

| Rang | Source | Gagne quand |
|------|--------|-------------|
| 1 | Ce contrat | toujours, sauf override projet |
| 2 | `STACK.md` / AGENTS du repo | lignes specifiques projet |
| 3 | Skills + recettes | le comment |
| 4 | Guides longs | rationale seulement |

`ai-index`, `llms.txt` et les skills Fenod doivent matcher cette page.

## Defaults

| Zone | Loi |
|------|-----|
| Langage | TypeScript strict |
| Runtime local/CI | **Node 24** + **pnpm** |
| App | **TanStack Start** sur **Cloudflare Workers** |
| Contenu / docs | **Astro** (Starlight) sur Workers static assets |
| API | Server functions Start d'abord. **Hono + ORPC** seulement si frontiere API / clients non-UI |
| Donnees | **Drizzle** 0.4x patche + **D1** |
| Auth | **Better Auth** (ligne stable patchee) |
| UI | **Tailwind v4 + shadcn/ui** |
| Data client | **TanStack Query + Router** |
| Fichiers | **R2** + metadata D1 |
| Cache / config | **KV** — pas une base |
| Jobs | **Queues / Workflows** |
| Coordination | **Durable Objects** si besoin |
| AI | **TanStack AI** + **AI Gateway** |
| Deploy | **Workers**, jamais de nouveau Pages. **1 Worker** → Git-connect ou CI `wrangler deploy`. **2+ Workers qui partagent des bindings** → **Alchemy** via GitHub Action. L'agent pousse Git ; il ne deploie pas. |
| Secrets | **Infisical** + secrets Worker |
| Observability | Workers Observability; Sentry pour apps produit |
| Rate limits | natif CF / DO — **pas de Redis** |
| Lint | **Oxlint** (`pnpm lint`) |
| Format | **Oxfmt** (`pnpm format` / `pnpm format:check`) |
| Types | **tsgo** (+ garder `typescript`) |
| Tests | **Vitest**; **Playwright** pour flux UI |
| Bundler | **Vite 8 + Rolldown** |

### Ne pas utiliser par defaut

npm/yarn, Bun/Deno comme baseline, Prisma, Postgres (hors trigger), Express, tRPC, Vercel AI SDK par defaut, hexagonal, repos autour de Drizzle, Alchemy day-one, Pages pour le neuf, Redis, Global API Key, secrets en clair, Drizzle v1 RC client, majors auth/RPC/ORM non revues.

## Forme

Day-one = **un package**, pas un monorepo.

```txt
app/
  src/
  wrangler.jsonc
  package.json
```

| Trigger | Alors |
|---------|-------|
| 2e deployable / libs partagees | monorepo |
| API multi-consumers | slices Hono/ORPC |
| 2+ Workers qui partagent D1 / R2 / KV / queues / domaines | **Alchemy** — l'Action deploie la plus petite unite |
| 4+ ressources CF, 3+ stages, multi-compte | **Alchemy** |
| 1 Worker (site Astro, app Start/Hono) | **Workers Builds Git-connect** ou CI `wrangler deploy` |
| Reporting / mandat Postgres / plafond D1 | Postgres (+ Hyperdrive) |
| Vrai offline terrain | design projet; Query persist sinon |
| Site Pages deja connecte | garder Pages pour ce site seulement |

## Qui deploie

- L'agent ne parle pas a Cloudflare pour staging/prod. Il pousse Git.
- 1 Worker : Workers Builds (Git-connect) ou CI `wrangler deploy`.
- 2+ Workers Alchemy : GitHub Action lance Alchemy. Ne pas Git-connecter ces Workers.
- Pages n'est pas eteint, mais gele. Pas de nouveau projet Pages.

## Verification

Ship gate:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Merge / risque: `pnpm build`, Playwright, verif navigateur si UI.

## Voir aussi

- [Index IA](/fr/ai-index/)
- [Contrat agent](/fr/agent-operating-contract/)
- [Pieges](/fr/gotchas/)
- [Recettes](/fr/recipes/)
- [Version anglaise (loi)](/stack-contract/)
