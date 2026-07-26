# fenod-smoke

Living reference for the [Fenod Stack Contract](https://stack.fenod.fr/stack-contract/).

One package. TanStack Start on Cloudflare Workers. Drizzle + D1. Better Auth. oRPC demo. Ultracite (Oxlint/Oxfmt). Wrangler.

## Setup

```bash
cd examples/smoke
pnpm install
pnpm db:local          # apply D1 migrations to local wrangler state
pnpm dev
```

Preferred secrets path (real projects):

```bash
infisical run --env=dev -- pnpm dev
```

## Ship gate

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Higher risk:

```bash
pnpm build
```

## Deploy

1. `pnpm dlx wrangler d1 create fenod-smoke` → put `database_id` in `wrangler.jsonc`
2. `pnpm db:remote` (migrations)
3. Put secrets: `infisical run --env=prod -- pnpm exec wrangler secret put BETTER_AUTH_SECRET` (or sync from Infisical)
4. `pnpm deploy` (uses `env -u CLOUDFLARE_API_TOKEN` when possible via script)

## Law map

See [STACK.md](./STACK.md).
