# Examples

| Path | Role |
|------|------|
| [`smoke/`](./smoke/) | **Law reference app** — single-package TanStack Start + Workers + D1 + Better Auth + Wrangler + Ultracite |

## Start a real product from smoke

```bash
cp -R examples/smoke ../my-app
cd ../my-app
rm -rf node_modules .wrangler dist
# rename package.json name, wrangler.jsonc name
pnpm install
pnpm dlx wrangler d1 create my-app   # paste database_id into wrangler.jsonc
cp .dev.vars.example .dev.vars       # or use Infisical
pnpm db:local
pnpm ship
pnpm dev
```

Then delete unused `src/routes/demo/*` pages and grow feature slices only when you need an API boundary.

Do not treat demo pages as product requirements. **Shape + scripts + STACK.md are the contract.**
