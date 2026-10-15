# Upgrading existing Fenod projects

October 2026 handbook release: `stack-2026.10`. This versions guidance, not a production-ready starter. The smoke reference remains experimental. Compare a project's recorded handbook revision with this release; do not copy the handbook or starter over an existing product.

## Preserve the working project

Record runtime/package-manager versions, layout, deployment owners, Workers and bindings in project `STACK.md`. Keep an existing pnpm 12 lockfile on its pinned pnpm 12 version. The handbook's pnpm 10 pin belongs to its references; it is not a downgrade instruction. Keep justified monorepos and Hono/oRPC boundaries. Existing Alchemy 0.x/v1 ownership stays in place until a separately planned migration.

Deliver one small change at a time, with its own verification and reversal instructions. Do not combine deployment ownership, runtime compatibility and auth/ORM majors.

## 1. Deployment authority and recovery

Replace agent instructions that authorize production CLI deployment with Git delivery to a gated pipeline. Projects can opt into **guarded direct pushes to main** for low-risk changes after the [deployment gate](docs/recipes.md#guarded-main-and-rollback) is verified. A PR is not mandatory for those changes. Auth, permissions, money, destructive operations, migrations, secrets and deployment ownership retain human review before production.

Make automated agent deploy entries explicitly refuse with a nonzero status; retain documented operator recovery commands. Add a redacted secret scan locally and in CI. A scan-only GitHub job does not block an independent Workers Builds deployment: required checks must finish inside the deployment path before publication.

Verify locally that agent deploy entries cannot contact Cloudflare. On a disposable target, prove that failing checks prevent deployment and that the previous application version can be restored. Record exact Worker/version IDs, smoke checks, recovery operator and evidence date. Do not enable automatic production deployment before that evidence exists.

## 2. Runtime and observability

Review compatibility changes before advancing an existing Worker's date; regenerate binding types and test critical flows against staging. Enable logs, explicit trace sampling and query-string redaction for every Worker. Dates at or after `2026-08-04` include Node compatibility by default. Reconcile source config with framework-generated deployment config. This changes runtime behavior and needs its own release.

## 3. Dependencies and types

Resolve security patches first, then coherent toolchain groups. October's reference changes include patched Sharp/Astro, Wrangler/Vite tooling, Better Auth/Drizzle, Vitest 5 and stable TS7. Consult the released manifests rather than freezing candidate versions in a product plan.

TS7 typechecking does not provide the historical compiler API. Keep a TS6 compatibility package only for tools whose installed peer requirements need it. Preserve a working product's TS7 setup if no such consumer exists. Replace Ultracite with standalone Oxlint/Oxfmt deliberately. Zod law is major 4, not a particular minor.

Verify a frozen install, lint/types/tests, production build, dependency audit and critical browser flows. A green `ship` gate alone does not establish a clean audit. Record remaining advisories with owners and rationale.

## 4. CI before deploy

Workers Builds may own builds/deployment for a suitable Worker; Alchemy-owned Workers retain their existing pipeline. Inventory migrations, backup, cron, queues, runtime secrets and changelog behavior before replacing a release script. A plain Worker deploy must not bypass those responsibilities.

Pin Node and pnpm remotely. Run release checks before publication, not only in an Actions job that races the deploy. Keep only necessary GitHub jobs; local attestations are not server-side enforcement. [CI recipe](docs/recipes.md#ci-for-product-repos).

## 5. Lint, errors and review

New files use the current no-casts/`any`/non-null rules. Existing codebases use the [legacy baseline policy](docs/stack-contract.md#existing-project-migrations): exact existing files/rules, a ceiling that prevents new violations or growth, and entries removed as repaired. This is migration debt, not a compliance claim.

Apply [error design](docs/errors.md) as affected boundaries change. Put the [review packet](docs/review-guide.md) in a PR or the guarded-main release record. Do not mass-rewrite stable business logic just to match a new example.

## Current rollout

| Project | First change | Constraints |
| --- | --- | --- |
| L'Épi Barbu | Agent authority, secret scan, project overrides and recovery runbook | Preserve pnpm 12. Its release script owns migrations/backups/changelog; Git-connect is not ready by default |
| Gwarell | Identify the live site's source before changing deploy commands | Preserve the site currently at `gwarell.fr`. Both local site configs name the same production Worker; that name alone cannot identify its source. Preserve dirty work |
| capm | Safety/overrides, then Node 24 and CI separately | Keep Alchemy 0.94 ownership and potentially unmerged worktree commits. [Later migration plan](plans/012-existing-project-rollout.md#capm-alchemy-migration-later) |

Live gates and production source ownership remain unverified until the project records platform evidence. No project is automatically upgraded by this handbook release.
