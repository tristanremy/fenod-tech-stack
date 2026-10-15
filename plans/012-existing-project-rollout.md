# Existing-project rollout — October 2026

Status: approved direction; local safety changes first. Baseline handbook revision: `0bf5ae7`. User decisions on 2026-10-15: allow faster Git-to-production delivery when guards and rollback are proven; defer capm's Alchemy migration; preserve the site currently served at `gwarell.fr`.

Follow [UPGRADING.md](../UPGRADING.md) in independent product repositories. No automatic file synchronization or resource reassignment.

## Ordered delivery

1. Release handbook guidance: existing pnpm 12 support, bounded lint migration, legacy Alchemy ownership and guarded-main acceptance.
2. L'Épi Barbu safety: real overrides, no agent CLI release authority, redacted secret scan and operator recovery runbook. Keep runtime/dependencies separate. Enabling automatic production requires disposable-target gate/rollback evidence.
3. Gwarell: preserve dirty trees; resolve production source before disabling the duplicate deploy path, then apply safety/runtime/toolchain/CI/lint batches separately.
4. capm: preserve current Alchemy ownership and worktree history. Apply safety and Node 24 independently of infrastructure migration.

## Guarded main acceptance

- A deliberately failing pre-deploy check leaves the deployed version unchanged on an isolated target.
- Checks use the exact source revision/target and finish before publication. A stale concurrent run cannot publish after a newer release.
- Secret scan, audit, critical browser flows and build are gates; a later GitHub status is not equivalent.
- Record the previous known-good version, artifact/source revision, smoke checks and recovery operator. Rehearse rollback and prevent the failing Git revision immediately deploying again.
- Expand/contract schema changes keep the previous app compatible. Database restore is a separate approved action with a recovery point and expected data-loss window, never an automatic response to an HTTP failure.
- Until proven, retain the operator release path. Sensitive changes need human review; standing approval for low-risk guarded-main delivery is recorded in project `STACK.md` after activation.

## Gwarell production ownership

Both `/Users/tr/dev/gwarell.fr/wrangler.jsonc` and `/Users/tr/dev/gwarell/apps/site/wrangler.jsonc` name `gwarell-fr-website-prod`. Preserve the live site. Neither that shared name nor an HTTP 200 identifies the source checkout.

Obtain active deployment source revision/build provenance and Git integration settings through authorized read-only platform access. Compare with both repositories and artifacts; record one owner. Then disable the other checkout's production command in a separate reviewed change. Do not archive or delete either dirty checkout merely because it appears redundant.

## capm Alchemy migration (later)

Keep `alchemy@0.94` as a project override. Never Git-connect its Workers or bypass Alchemy-owned bindings with Wrangler/`cf`.

1. Check/recover the two potentially unmerged `capm-dependency-cleanup` commits without resetting or deleting that worktree. Inventory resource IDs, domains, stages, bindings, state backend, secrets names and deploy jobs; exclude secret values.
2. Pin a reviewed Alchemy 2 release and compatible dependencies. Validate Node 24/pnpm and IaC-only mode with existing handlers; no forced Effect rewrite.
3. Back up state/data; test adoption in an isolated account/stage with disposable resources. Prove IDs/data remain intact and inspect plans for replacement/deletion. Do not test adoption against production first.
4. Rehearse failed deploy, state recovery, isolated teardown and return to the previous toolchain/artifact. Restoring state alone does not restore databases or reverse every provider operation.
5. Define one owner and scoped credentials per environment, deployment serialization, approvals, migrations and smoke checks. Handover only after verification; never run both owners against the same resources.
6. Present inventory, plan, recovery evidence and cutover steps for distinct production approval. Keep the current deployment working until cutover.

Completion: stable production resource IDs/data, correct bindings, repeatable no-op deployment, isolated teardown, tested recovery and explicit ownership. No date promised; this is outside the first safety batch.
