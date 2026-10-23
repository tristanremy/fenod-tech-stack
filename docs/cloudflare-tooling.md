---
title: "Cloudflare tooling"
description: "Wrangler baseline, optional cf CLI, and conditional Alchemy 2 adoption."
verified: 2026-10-23
---

Follow the [Stack Contract](stack-contract.md) and [authority rules](agent-operating-contract.md). These are source-backed adoption recipes; this handbook has no tested `cf` migration or Alchemy 2 reference. Agents prepare local changes and push Git. Remote provisioning, deployments, migrations, DNS and deletion go through the approved CI/broker/operator flow, whichever CLI is used.

## Choose the tool

| Need | Choice |
| --- | --- |
| Existing `wrangler.jsonc` project; current references | Keep project scripts on Wrangler |
| Discover Cloudflare API commands; inspect account/resource APIs | Optional `cf` alongside Wrangler |
| Typed project configuration or build-once deployment artifacts | Evaluate an explicit `cf` migration |
| Coordinated resources, repeatable stages/previews, adoption or lifecycle tests | Evaluate Alchemy 2 |
| One Astro + EmDash Worker with D1 and R2 | Wrangler is sufficient; CMS bindings do not force Alchemy |

## Add cf without migrating the project

`cf` is Cloudflare's new CLI and is still **beta**. Pin a reviewed version in a pilot; do not replace existing reference scripts. The examples below use `1.0.0-beta.14`, reviewed on 2026-10-11. [Upstream overview](https://developers.cloudflare.com/cf/).

Discover and inspect commands without Cloudflare credentials or an account API request:

```bash
pnpm dlx cf@1.0.0-beta.14 cli search "list D1 databases"
pnpm dlx cf@1.0.0-beta.14 schema d1 list
pnpm dlx cf@1.0.0-beta.14 d1 list --help
```

Check the command schema and help before constructing arguments. Generated API commands support `--dry-run` for inspecting a request without sending it. Most results are JSON; lists may contain only one page. [Agent workflow](https://developers.cloudflare.com/cf/agents/).

Resource/account commands can coexist with Wrangler, but:

- `cf auth login` has its own OAuth credentials; Wrangler login is not reused.
- Resource commands do not read `wrangler.jsonc` or its `account_id`. Select the account explicitly; automation uses `CLOUDFLARE_ACCOUNT_ID` and a scoped `CLOUDFLARE_API_TOKEN`.
- Data commands default to **remote**. `--local` is available only for supported KV/D1/R2 operations; inspect help rather than assuming local execution.
- Keep Wrangler for `dev`, `types`, builds and deployments until a project migration is adopted. Beta gaps include live tail and setting individual secrets.

The repository's production authority boundary applies to `cf` resource commands too. Command discovery is local; an account read needs the authorized target and read scope. [Wrangler comparison](https://developers.cloudflare.com/cf/wrangler/), [CI authentication](https://developers.cloudflare.com/cf/ci/).

## Migrate a project to cf deliberately

Do not run `cf dev`, `cf build` or `cf deploy` in an unmigrated Wrangler project. Automatic configuration can rewrite manifests, scripts, Vite and bindings. Begin in an isolated checkout with:

```bash
pnpm dlx cf@1.0.0-beta.14 migrate --dry-run
```

> **Warning: `cloudflare.config.ts` needs `@cloudflare/vite-plugin` v2 beta.** `@cloudflare/vite-plugin` 1.65.0 (2026-10-23) removed `experimental.newConfig` from v1. Vite plugin v1 now reads Wrangler configuration files only. A project that ran `cf migrate` and uses `cloudflare.config.ts` must move to the v2 beta of `@cloudflare/vite-plugin`; staying on v1 breaks its build on the next update. Projects that keep `wrangler.jsonc`, like the starter (`^1.63.1`), are unaffected. [Release notes](https://github.com/cloudflare/workers-sdk/releases/tag/%40cloudflare%2Fvite-plugin%401.65.0).

If the migration is part of the task, run `migrate` locally and review the resulting `cloudflare.config.ts`, package/lockfile changes, modes, routes, resource IDs and binding names. Resolve generated TODOs, including manual DO migration/Workflow/Container work. Keep pnpm and pin the adopted CLI. Retain the Wrangler config while remaining Wrangler operations need it. [Migration procedure](https://developers.cloudflare.com/cf/wrangler/migrate/).

Before changing a project's baseline, prove local auth/config startup, binding types, D1 migrations, build and existing browser flows. Then have protected CI/operator validate the same artifact against an isolated target, secret synchronization and rollback. Record results in project `STACK.md`; a successful dry run alone does not promote `cf`.

## Adopt Alchemy 2 for a written infrastructure need

Two Workers or a resource count are prompts to evaluate infrastructure management. Adopt Alchemy when coordinating resource ownership, environments and recovery is simpler than the current deploy flow. Write the problem and the resources/stages it would own before adding it.

Alchemy 2 remains **beta**; the reviewed package is `alchemy@2.0.0-beta.81` on 2026-10-11. Pin the exact beta and compatible dependencies. Follow the upstream **pnpm** setup and validate Node 24 local/CI execution. Bun is not a Fenod requirement. [Repository status](https://github.com/alchemy-run/alchemy), [setup](https://alchemy.run/getting-started/).

Start with **infrastructure as code**: Alchemy declares resources and binds a conventional Worker entry point. Its optional integrated Effect application runtime is a separate architecture choice; do not rewrite a Start/Hono/Astro app to use it. [Supported IaC mode](https://alchemy.run/what-is-alchemy/).

Before client production, the protected pilot must demonstrate:

1. An inspected plan and adoption of existing resource IDs without unintended replacement/deletion.
2. Separate stages and scoped credentials; preview teardown cannot remove shared persistent data.
3. A protected state store, backed-up state/secrets, and a rehearsed recovery procedure.
4. Repeatable deploys, reviewed D1 migrations, bindings, observability and application smoke checks.
5. One deployment owner per Worker: CI runs Alchemy; do not also Git-connect those Workers or mutate owned resources through another deploy path.

Use the smallest affected stack/unit in CI once adopted. Production actions remain gated. See the current [documentation index](https://alchemy.run/llms.txt) for plans, adoption, state, stages and tests; v1 snippets are not a v2 migration guide.
