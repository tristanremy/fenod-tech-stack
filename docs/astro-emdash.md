---
title: "Astro + EmDash client content"
description: "Client editing on Workers, with supported CMS auth, publishing and recovery."
verified: 2026-10-11
---

Use **Astro + EmDash as the preferred candidate when clients need to edit and publish website content directly**. Keep static Astro for developer-maintained content. Follow the [Stack Contract](stack-contract.md); this recipe is source-backed, with a Fenod CMS pilot still pending. [`examples/astro`](../examples/astro/README.md) proves the static path only.

EmDash's 1.x line is stable upstream. Pin a reviewed release and its adapters in the project lockfile; `create-emdash@1.2.0` is the scaffolder reviewed on 2026-10-11. [Stable announcement](https://blog.cloudflare.com/emdash-cms-plugin-registry/), [upstream project](https://github.com/emdash-cms/emdash).

## Start one CMS site

Use Node 24 + pnpm in a new project directory:

```bash
pnpm create emdash@1.2.0
```

Choose **Cloudflare**, the appropriate starter/theme, and **pnpm**. Review generated package versions, scripts, ignored local files and bindings before starting development. For an existing Astro site, follow the [integration guide](https://docs.emdashcms.com/existing-project/) instead of replacing its theme. [Scaffolder](https://docs.emdashcms.com/getting-started/).

The target is one **Astro SSR Worker**, **D1** content and **R2** media. Use `@astrojs/cloudflare`, React for the admin, `emdash/astro`, and the D1/R2 adapters from `@emdash-cms/cloudflare`. Preserve the upstream Worker entry point and scheduled handler/cron for scheduled publishing and maintenance. Set the current compatibility date and Workers Observability. Omit the plugin sandbox runner/`LOADER` binding until sandboxed plugins are needed. [Cloudflare configuration](https://docs.emdashcms.com/deployment/cloudflare/).

The template currently uses Wrangler and may provision named D1/R2 resources on its first deploy. That deploy belongs to protected CI/operator flow. Local scaffolding is not authorization to provision infrastructure. See [tooling choices](cloudflare-tooling.md); one CMS Worker plus D1/R2 does not force Alchemy.

**Bounded CMS exception:** EmDash manages its own schema/migrations with Kysely and its supported authentication. Do not graft Drizzle or Better Auth onto CMS internals. Application features outside the CMS retain Fenod's Drizzle + D1 / Better Auth defaults. [Architecture](https://docs.emdashcms.com/contributing/architecture/).

Review core migration mode before a production release: the template's `auto` mode applies pending migrations on the first request. Use the supported controlled migration workflow so approved migrations and a recovery point precede new traffic; record the release policy in project `STACK.md`. [Core migrations](https://docs.emdashcms.com/deployment/core-migrations/).

## Give clients a supported editing workflow

Developers own Astro templates, content fields and allowed blocks/sections. Clients edit text, images, metadata and agreed page sections through `/_emdash/admin/`. Define the editable model with the client; the CMS does not grant arbitrary control over application code or layouts. Preserve the existing [metadata, JSON-LD and image practices](astro.md) at the CMS input/rendering boundary. [Themes](https://docs.emdashcms.com/themes/creating-themes/), [sections](https://docs.emdashcms.com/guides/sections/).

For R2 images, use EmDash's supported image component/endpoint and verify the generated `IMAGES` binding. Build-time `astro:assets` fixtures do not prove CMS media delivery. Public pages must not depend on a visitor being signed into the protected media API. If using a public R2 media origin, restrict it to intended media objects: automatic JSON archives share the `backups/` prefix and must remain private. Check anonymous images/downloads and denied backup URLs. [Cloudflare image delivery](https://docs.emdashcms.com/deployment/cloudflare/#image-transformation), [storage boundary](https://docs.emdashcms.com/deployment/storage/#public-access).

For protected CMS admin, prefer EmDash's **supported Cloudflare Access adapter**:

- Protect the complete `/_emdash/*` path, including the REST API. The public website stays public. Cover alternate Worker/preview hostnames too so the policy cannot be bypassed.
- Configure the expected team domain and runtime `CF_ACCESS_AUDIENCE`; let EmDash validate Access JWTs and enforce its own roles. The operator must perform the first login/setup: the first user becomes Admin.
- Give clients Editor for all site content, Author for their own content, or Contributor when publication needs approval. Keep Admin for site operators; choose whether IdP groups or CMS role assignments own role changes.
- Access is an exclusive production auth mode: native passkeys, provider login, magic links and invitations are unavailable in that mode. A project choosing native EmDash auth uses its supported providers and required email setup; it does not add Better Auth.

Access selects identities; CMS authorization still controls editing and publishing. Validate both. [Authentication and Access integration](https://docs.emdashcms.com/guides/authentication/), [Fenod security](security-model.md#cloudflare-access-previews--staging--internal-admin).

## Publish without a site rebuild

CMS-backed routes must render at request time and query **published** content. Saving a draft must not change the anonymous page. Preview access stays authenticated and preview responses stay out of shared caches. [Content queries](https://docs.emdashcms.com/guides/querying-content/), [preview mode](https://docs.emdashcms.com/guides/preview/).

Publishing can update an SSR page without a code deploy; a prerendered route still needs rebuilding. Define and test public cache invalidation or a bounded TTL before promising immediate updates. Begin without extra public response caching, then add the supported caching path when needed. [Astro integration](https://docs.emdashcms.com/coming-from/astro/), [Cloudflare caching](https://docs.emdashcms.com/deployment/cloudflare/).

## Prove handoff and recovery

Before calling a client site ready, record these acceptance results:

1. A client account changes text and an image, saves a draft, checks a protected preview, publishes, and sees the correct anonymous page without a code rebuild. Exercise the chosen cache policy.
2. The same role is denied settings/plugins/user administration; an unauthenticated user cannot read drafts or invoke admin/API writes. Check alternate hostnames, canonical/JSON-LD output, anonymous media and denied backup URLs.
3. If scheduled publishing is offered, prove it on the deployed cron/handler; a local development timer does not validate production wiring.
4. Restore an isolated site from a full database recovery point, matching media objects, application artifact and the complete `EMDASH_ENCRYPTION_KEY` rotation list. Verify sign-in, content/media, schema and a write.
5. Rehearse an upgrade/migration on that copy before promoting it. Keep version, target, results, recovery window and operator responsibility in project `STACK.md`.

D1 Time Travel alone does not recover R2 or keys. EmDash JSON content backups cannot restore the full database. For an offsite D1 dump with search enabled, use the supported FTS5-aware procedure and search-index rebuild; a generic `wrangler d1 export` is insufficient. Keep keys in Infisical/Worker secrets and recovery material outside Git and agent context. [Backups and recovery](https://docs.emdashcms.com/guides/backups/), [key management](https://docs.emdashcms.com/deployment/secrets/).

Pending here: a disposable, protected Fenod pilot covering the acceptance flow above. No CMS reference, live client migration or production deployment is claimed by this recipe.
