# Experimental application starter

One package: Node 24, pnpm, TanStack Start/Workers, Drizzle/D1, Better Auth, Query, Tailwind/shadcn, Oxlint/Oxfmt and fixture-only Varlock. Read [AGENTS.md](./AGENTS.md) and [STACK.md](./STACK.md).

**Local-only, not production-ready.** No Doppler or Cloudflare account is required. Remote commands fail before Wrangler runs. Real vault resolution, deployed recovery, email verification, account recovery and operational controls remain unverified.

## Bootstrap

```bash
pnpm install --frozen-lockfile
pnpm config:check
pnpm cf-types
pnpm db:local
pnpm ship
pnpm dev
```

Open `http://localhost:3000`. The strict port prevents the server silently changing its origin. Sign up, create/toggle/delete an item, sign out, and try a second user. Every read and write derives ownership from the checked session. Inputs are parsed from `unknown`; expected failures are typed outcomes.

`.env.schema` permits synthetic test values only. Varlock's official Cloudflare Vite plugin injects validated Miniflare bindings; no vault plugin or resolver is installed. Internal `DOPPLER_TOKEN` is omitted from app bindings and child configuration. Its **name**, never its value, may appear in raw `overrideKeys` metadata. `@cache=disabled` disables Varlock disk caching; redaction is not credential isolation.

Do not create `.env` or `.dev.vars`. Vite refuses existing overrides without reading/printing/deleting them: move old files to a secure location and migrate deliberately. `pnpm config:check` explicitly selects the schema and uses redacted `--agent` output. Never use plain `json-full` with real values.

## Verify

```bash
pnpm ship
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm audit --audit-level high
```

`pnpm ship` is read-only for source files. Type generation is explicit (`pnpm cf-types`); its random temporary-file header is normalized for reproducibility. `pnpm generate-routes` uses the Start Vite build, the same generator that owns Start's registration footer. Inspect generated diffs; never run a competing router CLI.

`pnpm test:e2e` applies local D1 migrations and uses unique synthetic users. Repeated migrations preserve local data. It never reuses an unrelated running server. Browser tests include sign-up, CRUD, logout, malformed inputs and cross-user/anonymous authorization through the real server functions. Local state stays under ignored `.wrangler`. Tests and builds need no credentials; dependency/browser installation needs network access.

The post-build canary scan checks client **and** server output for the known fixture and an optional synthetic internal token. It is a regression detector, not a universal secret scanner. Two moderate Vitest 3 advisories remain: migrate the test runtime coherently before production; high/critical audit findings fail CI.

## Export and provenance

From the upstream handbook, use `node scripts/export-starter.mjs <commit> <new-destination>`. It exports only the committed application tree, refuses an existing destination and unsafe entries, and writes `starter-provenance.json`. No working-tree secrets, dependencies, caches or database state are copied. Requirements: Node 24, pnpm, Git and standard `tar` (macOS/Linux).

Inside an exported app, there is no dependency on parent documentation or global agent tools. CI checks the standalone directory. Upstream handbook CI additionally exports the exact commit before testing.

## Remote deployment (not authorized in this starter)

This repo ships no remote deploy script: `deploy` and `db:remote` fail closed, and agents push Git instead of deploying. If a human or protected job is later approved to deploy an exported app, the handbook's disposable pilot established these facts:

- The built Worker needs the pinned `@varlock/cloudflare-integration` wrapper. Plain `wrangler deploy` fails because the runtime requires the serialized `__VARLOCK_ENV` blob that only the wrapper uploads.
- Supply the real secret through trusted process input, never as a command-line argument. The wrapper passes secrets to Wrangler over a FIFO, so they do not become arguments.
- Inventory secrets by name before and after any modifying sync. An undeclared secret is not removed automatically, and a secret inventory lists neither public vars nor bindings. Plan removals explicitly, then verify.
- Recovery is not a database operation: Worker rollback leaves D1 untouched. Check schema compatibility locally with `node scripts/migration-compat.test.mjs`, and gate preview hosts behind Cloudflare Access before real data exists.

Keep `fenod-smoke` names while verifying the baseline. For a product rename, change `package.json` name, Wrangler Worker name, D1 `database_name`, and the `db:local` script argument together, then rerun `pnpm cf-types` and all checks. Keep the `DB` binding name. The zero UUID is a local placeholder, not a provisioned resource. No remote ID is required locally.

Do not automatically synchronize products. Review upstream changes against the provenance revision. [Maintenance and approval plan](https://github.com/tristanremy/fenod-tech-stack/blob/UPSTREAM_REVISION/plans/010-maintained-starter.md).
