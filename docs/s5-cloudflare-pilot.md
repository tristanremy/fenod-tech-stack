---
title: "S5 disposable Cloudflare pilot"
description: "Deployment findings, bounded recovery evidence and verified cleanup. Not production approval."
verified: 2026-09
---

## Status

**S5 partial; resources removed; S6 not promoted.** This is the record of the
owner-authorized September 28, 2026 experiment, not permission to recreate it.
Infisical remains the default. The starter remains experimental and fixture-only.
S4 was [closed with documented limits](doppler-local-pilot.md), not fully proven.

The disposable app was exported from
`277bc64e2b7d111867fcb8a19bef23fec602e85b`. Its Worker/package/database names,
`db:local` target, D1 id, public origin and fixture constraints were adapted
outside the source tree. Preflight fixes `976e251` and `35733bd` were committed
upstream during the pilot; the disposable checker was patched during testing.
**The adapted deployed tree was not captured as an immutable revision.** Export
provenance alone therefore does not identify the exact deployed artifact (M2).

Pinned tools: Varlock 1.19.0, Cloudflare integration 1.5.2, Wrangler 4.122.0.
The owner ran deployment and rollback from their terminal. The agent performed
scoped provisioning, verification and authorized cleanup. Local OAuth was
accessible to both: this was a policy boundary, not OS credential isolation.
No new GitHub Actions run was requested; verification was local.

## Findings and corrected procedure

For a future separately approved pilot:

1. Freeze the **adapted** source revision and build artifact before deployment.
   Record exact target/account, binding ids, tool versions, budget and cleanup
   scope. Keep builds/tests free of real secrets. Configure preview protection
   and explicit `workers_dev` / `preview_urls` settings; Access was not proven in
   this pilot.
2. Adapt fixture constraints only in the reviewed target copy. A public HTTPS
   origin and a real auth secret cannot pass loopback/`test-only-` constraints.
   Process environment overrides are validated too. Keep the secret minimum
   length; never deploy the synthetic default. Reject fixture values explicitly
   in a future remote-deploy gate: removing the prefix constraint alone does
   **not** provide that protection.
3. Capture a **names/classifications-only inventory before any modifying sync**.
   `wrangler secret list --format json` lists secrets, not public vars or D1
   bindings. The current preflight does not validate the entire target config.
   `--allow-remove NAME` approves a plan only; it does not delete anything.
4. Use the pinned supported `varlock-wrangler deploy -c dist/server/wrangler.json`
   from the exported app root in the authorized operator environment. Supply the
   real secret through trusted process input, not a tracked file or logged
   argument. Plain Wrangler uploads failed twice with code 10021:
   `initVarlockEnv failed`. The runtime required `__VARLOCK_ENV`; uploading an
   individual `BETTER_AUTH_SECRET` did not supply that serialized configuration.
   The wrapper supplied it successfully. Never handcraft the blob or disable
   runtime validation to bypass the failure.
5. Verify desired names and classifications again after deployment. **Do not
   infer secret deletion from `--keep-vars=false`.** A wrapper redeploy retained
   `LEGACY_DUMMY`. Only the explicitly approved
   `wrangler secret delete LEGACY_DUMMY --name fenod-smoke-s5` removed it in this
   pilot. The next inventory contained exactly `BETTER_AUTH_SECRET` and
   `__VARLOCK_ENV`. Check integration-managed bindings separately; the current
   checker's broad `_VARLOCK_` / `__VARLOCK_` exemptions are not proof that every
   matching name is legitimate.
6. Test login and owned CRUD after secret rotation. A new secret can invalidate
   sessions; successful fresh login does not prove old-cookie rejection.
7. Recovery is an approved deployment operation too. Select a known working
   version explicitly, review secret changes, and test against the current D1
   schema. Worker rollback does **not** roll back D1. Never automate destructive
   database rollback as a side effect of code recovery.
8. Delete only the approved disposable resources and local copy; verify their
   absence independently. Record billable usage separately from the standing
   account subscription and distinguish an estimate from a final invoice.

## Observed evidence

| Check | Result and limit |
| --- | --- |
| First working deployment | Owner version `f9916bd4-c804-4b3d-98e1-75ea20336e2c`; root/auth health HTTP 200. Initial real inventory verification followed deployment rather than preceding it (M2 gap). |
| Secret rotation | Owner version `5286a8c8-43ee-4ffa-845d-d424633fff2d`; fresh login with an existing account succeeded. No old-cookie invalidation assertion. |
| Browser workflow | Signup, create/read, toggle/update, delete followed by navigation, and sign-out observed. Bob's list had no Alice item. This is UI isolation evidence, not a remote forged-request authorization test. No page errors reported. |
| Secret removal | Preflight rejected unapproved `LEGACY_DUMMY` with exit 1, accepted the named allowance, then explicit deletion succeeded. Required secret names remained present. Automatic reconciliation was disproven. |
| Vault boundary | No individual `DOPPLER_TOKEN` in the remote secret inventory; no Doppler resolver in the target schema. Runtime used the injected blob. Browser network observations alone cannot prove absence of server-side calls or internal values in a serialized secret. |
| Recovery | Owner restored `f9916bd4-c804-4b3d-98e1-75ea20336e2c` to 100% traffic and confirmed both changed secrets. Existing account login and health passed; no migrations pending. Both versions used the same four-migration schema: this does not prove compatibility across a schema-changing release. |
| Worker cleanup | `fenod-smoke-s5` deleted; URL returned 404 and versions API returned 10007, Worker does not exist. |
| D1 cleanup | `fenod-smoke-s5`, id `9baf904e-7a72-4359-aef9-9641435d1f29`, deleted; exact-name list returned `[]`. |
| Local cleanup | `/tmp/fenod-s5-app` and temporary inventories/screenshots removed; paths verified absent. |
| Cost | Owner's Billable Usage screenshot showed $0.00 total/projected usage cost, zero billable Workers/D1/log usage, observed September 2–28 in the September 2–October 1 cycle. This is account-level estimated usage, not a final invoice or per-pilot allocation. Existing Workers Paid subscription excluded. |

## Remaining acceptance gaps

- M2 remains incomplete: pre-deploy inventory ordering and immutable adapted
  artifact provenance cannot be reconstructed from these observations.
- Remote adversarial authorization, serialized internal-token exclusion,
  schema-changing recovery, Access protection and fake-Wrangler command
  construction are not established by this live pilot.
- The generic preflight is a names-only planning check, not a deployment safety
  gate, a deletion implementation or a full inventory/classification validator.
- No existing application was migrated. No starter release, default-secret-store
  change or production readiness is implied. S6 requires a separate adoption
  review and resolution or explicit disposition of outstanding acceptance gaps.
