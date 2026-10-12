---
title: "Start a new project"
description: "Day 0 to first deploy for a Fenod client project: who does each step, in order."
verified: 2026-10
---

**Agent** steps need only the repo. **Human** steps need a GitHub or Cloudflare account. Agents never create remote resources, set secrets or deploy ([operating contract](agent-operating-contract.md)).

## 1. Pick the type

| Project | Path |
| --- | --- |
| App (auth, data, server logic) | This page |
| Website, developer-maintained content | [Astro recipe](astro.md) + [`examples/astro`](../examples/astro/README.md). Follow steps 4–5 below with `pnpm install --frozen-lockfile && pnpm ship` as the build command |
| Website, client edits content | [Astro + EmDash](astro-emdash.md). Candidate only: its handoff/recovery pilot comes first |

## 2. Create from the starter (agent)

Export the committed starter from an exact handbook revision. Never copy a working tree or scaffold from scratch: the export already carries CI, lint, owner-scoped data, migrations and browser tests.

```bash
cd fenod-tech-stack && git pull
node scripts/export-starter.mjs "$(git rev-parse HEAD)" ../client-app
cd ../client-app && git init -b main
```

Rename together, then rerun `pnpm cf-types`: `package.json` `name`, Wrangler `name`, D1 `database_name`, the `db:local` script argument, and the app name in `src/components/Header.tsx` / `Footer.tsx`. Keep the `DB` binding.

## 3. Verify locally (agent)

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm release   # ship + build + audit + e2e
git add -A && git commit -m "chore: start from Fenod starter"
```

## 4. GitHub (human)

1. Create a **private** repo and push `main`.
2. Install the [Renovate app](https://github.com/apps/renovate) on it; `renovate.json` is already included.
3. After step 5: require the Workers Builds check and `secrets` on `main` (needs a paid GitHub plan for private repos).

The included workflow runs the secret scan on PRs, and the full check on PRs until Workers Builds is connected.

## 5. Cloudflare (human)

1. `wrangler d1 create <database_name>`; an agent commits the returned `database_id` to `wrangler.jsonc`.
2. Connect Workers Builds and set the `WORKERS_BUILDS` repo variable: [starter README → CI](../examples/smoke/README.md#ci). Build minutes are included in the Cloudflare plan.
3. Put [Cloudflare Access](security-model.md#cloudflare-access-previews--staging--internal-admin) on preview URLs and `*.workers.dev`.
4. Attach the custom domain when going live.

## 6. Before the first production deploy (gate)

The starter is **fixture-only**: `.env.schema` accepts only test values, and `deploy` / `db:remote` fail on purpose. Going live is a project task, and the first production project is a pilot:

- Replace the fixture config with the default secrets path: Infisical → Worker secrets, Zod validation ([environment and secrets](environment-secrets.md)). Keeping Varlock instead requires its written trigger and the [pilot findings](s5-cloudflare-pilot.md) (wrapper deploy, secret inventory).
- Set `BETTER_AUTH_URL` to the real origin and generate a fresh `BETTER_AUTH_SECRET` as a Worker secret.
- Choose who runs remote migrations (human terminal or the Workers Builds deploy command). Migrations must stay compatible with the previous Worker: `node scripts/migration-compat.test.mjs`.
- Replace the fail-closed `deploy` / `db:remote` scripts, and the matching assertion in `scripts/check-portable.mjs`, only together with the steps above.
- Rehearse a rollback: Worker rollback does not roll back D1.

## 7. Day to day (agent)

Branch → change → `pnpm release` → push → PR. Workers Builds checks the branch and posts a preview; Actions scans for secrets. A human merges; `main` deploys through Workers Builds. Follow the triggers in the [Stack Contract](stack-contract.md) before adding Hono/oRPC, a monorepo, Alchemy or Durable Objects.
