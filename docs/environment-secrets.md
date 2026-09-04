---
title: "Environment and Secrets"
description: "Secret ownership, runtime injection, validation, and leak prevention."
verified: 2026-09
---

## Default path

```txt
Infisical (source of truth)
→ sync / CI injection
→ Cloudflare Worker secrets at runtime
```

- Use `infisical run --env=dev -- pnpm dev` locally.
- `.dev.vars` is allowed only when ignored and never committed.
- Use Worker secrets for sensitive runtime values. Keep non-secret configuration in `wrangler.jsonc` `vars`.
- Do not fetch a vault on each request. Do not use Varlock by default.

## Validation

Validate runtime configuration with **Zod 4.5.x** at the boundary. Keep the schema small and explicit. Zod validates configuration; it does not store or distribute secrets.

## Leak prevention

Use one local/CI scanner: `infisical scan git-changes --staged`. Enable GitHub push protection when it is available. A detected secret must be rotated; deleting it from a later commit is not remediation.

## Tool choices

| Need | Default | Not a default |
| --- | --- | --- |
| Secret source of truth | Infisical | Doppler, 1Password, Dotenvx |
| Worker runtime secret | Cloudflare Worker secret | vault request per Worker request |
| Typed validation | Zod | Varlock, T3 Env for small schemas |
| Shared account secret | Evaluate Cloudflare Secrets Store | adopt before service support is confirmed |
| Schema, log redaction, response leak checks | Varlock only with a written trigger | replace Infisical |

## Varlock trigger

Evaluate Varlock only when an application has all of these: a large typed configuration surface, several environments with complex resolution, and a demonstrated need for runtime response/log redaction beyond the scanner and app controls. Its Cloudflare integration requires `varlock-wrangler`; its deploy replaces Worker vars/secrets not in its schema.

## Upgrade policy

- Keep Zod on the current 4.5.x patch.
- Evaluate Vitest majors in a dedicated change and run its migration checks.
- Evaluate pnpm 12 in a dedicated branch. Do not depend on npm `latest` to select its release channel.
- Migrate from `@typescript/native-preview`/`tsgo` to stable TypeScript 7/`tsc` only after tooling validation.
- Treat `pnpm audit` findings as tracked work. Do not suppress the Drizzle Kit transitive esbuild finding without a verified upstream fix or tested override.
