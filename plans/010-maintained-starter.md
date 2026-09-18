# Maintained application starter and secrets pilot

Status: **in progress — S0 through S2 delivered locally; S3 next**. Direction approved by the owner on 2026-09-18.
Baseline: `886a4d5`. Builds on [audit 009](009-agent-first-audit.md), not a replacement for its evidence.

Progress: S0 delivered (`4ad561c`, `4895033`) — advisory repairs, self-contained secret ignores, experimental status. S1 delivered (`53452fc`) — owned-item workflow, auth as a Start route, Hono/oRPC removed, browser-verified two-user isolation. S2 delivered in the current revision — pinned Varlock, fixture-only schema, real Cloudflare Vite/Miniflare injection, redaction/internal/bundle checks and fail-closed remote scripts. **Next: S3** (portable tracked-file export and exported-app CI). S4 and S5 still need explicit authorization.

The owner approved turning the pilot into a maintained starter within this repository. This plan authorizes no account provisioning, credential access, deployment, destructive cleanup or migration of existing applications. The current [Stack Contract](../docs/stack-contract.md) remains active until the pilot passes and its adoption change is reviewed.

## Outcome and scope

Evolve **`examples/smoke` in place** into one maintained, exportable application starter. Keep its path during implementation to avoid a repository-wide rename and duplicate sources. Call it experimental until the release gates below pass. Keep **`examples/astro` separate**; do not install app auth, Doppler or Varlock into a static site by default.

The starter must let an agent, from a pinned revision:

1. Export an application without copying secrets, caches or local state.
2. Install pinned dependencies and run locally without a vault account or Cloudflare credentials.
3. Follow a small authenticated workflow: sign in → create/read/update/delete an owned item in D1 → sign out.
4. Extend that workflow with server validation, authorization, predictable cache invalidation and actionable checks.
5. Use Doppler/Varlock for approved integration environments without granting the agent general vault access.
6. Hand an approved revision to a separate deployment process. No automatic production authority follows from using the starter.

Not in v1: a new repository, application monorepo, package publisher, interactive scaffold CLI, plugin framework, MCP secrets server, credential proxy, generic secret broker, multi-tenant organization system, AI chat, email sending, billing, R2 uploads, realtime, offline sync or Alchemy. Add these only on existing contract triggers. Do not maintain a parallel copy of the old playground; Git history preserves it.

## Architecture decisions

| Area | Decision |
| --- | --- |
| Application | One package: Node 24, pnpm, TanStack Start, Workers, Drizzle/D1, Better Auth, Tailwind/shadcn. Preserve tested lint/format/type gates. |
| API surface | Start server functions for app CRUD. Mount Better Auth through the supported Start route integration. Remove unused Hono/oRPC/OpenAPI playground code from the default seed; document the optional API-boundary recipe, not a second runnable starter. Verify replacement routes before removing dependencies. |
| Domain example | A small owned-item list with a real `userId` relation. Ownership derives from the checked session, never a browser-supplied owner. No organizations until a product needs them. |
| Secrets source | Doppler is the **pilot candidate**. One project per application, separately scoped configurations. Do not layer it over Infisical for the same secret. |
| Configuration | `.env.schema` declares configuration names, types, sensitivity and explicit resolution. Nonsecret environment selection must map unambiguously to the target. Wrangler retains D1/R2/KV bindings, not duplicate secret values. |
| Runtime validation | Validate the configuration actually consumed by auth. Use Varlock's supported Worker runtime validation where proven; retain only a small Zod boundary for constraints not covered there. Avoid two independently maintained schemas for the same configuration. Zod still owns request/domain validation. |
| Runtime secret storage | Native Worker secrets after an approved deployment; no Doppler request on every application request. D1 uses a binding, **not `DATABASE_URL`**. |
| Agent interface | Portable example-local `AGENTS.md`, local commands, clear authority boundaries and immutable upstream reference. No dependency on this user's Pi installation, home directory or global CLI. |
| Export/versioning | Export only committed starter files from an explicit revision into an empty destination. Record source revision and starter release in a small nonsecret provenance file. Products are independent copies, not automatically synchronized forks. |

### Environment and authority matrix

| Mode | Values | Allowed consumer | Must not happen |
| --- | --- | --- | --- |
| `test` / local fixture mode | Clearly synthetic local-only values; disposable local D1 | Agent, developer, untrusted CI | Resolve Doppler, inherit a vault token, make external service calls or pass remote-deploy preflight |
| `dev` | Real development values scoped to one app/config | Trusted developer or approved isolated integration job | Access another app or production |
| `stg` | Dedicated test-service accounts and synthetic data | Approved verification/deployment job | Use customer data, send real user email, imply production approval |
| `prd` | Production secrets | Separate protected deployment job and target Worker | Expose credentials to unreviewed branches, tests, build hooks or general agent tools |

A normal agent checkout defaults to local fixture mode, never automatically to `prd`. Real values remain inaccessible to the task's identity. `APP_ENV`, Doppler config and Cloudflare target must be checked together; unknown or inconsistent combinations fail. Fixture values must be rejected for remote targets even if somebody changes one environment flag.

`@internal` controls injection, not host/process access. A container or worktree alone is not proof of isolation. Do not mount vault caches, home directories, model credentials or a Docker socket into agent tasks. Integration tests that receive development keys execute code capable of reading those keys: use a separate low-privilege job with constrained data and egress.

## Work packages and dependencies

One writer per checkout. Each package below is a reviewable batch of small commits, with evidence and an unresolved-risk note. Independent read-only review may supplement, never replace, acceptance checks.

### S0 — Establish the experimental baseline

**Scope:** example README/STACK, dependency manifests/lockfiles, ignores and regression setup. Audit: SEC01, AR05, AR06.

- Mark smoke experimental with a precise support matrix; preserve the current passing tests as baseline evidence.
- Repair the two known high dependency findings through compatible upstream updates or narrowly justified temporary overrides. Re-run the advisory scan; the old count is a snapshot, not a permanent inventory.
- Make root and both exportable examples' secret/artifact ignore rules self-contained. Keep placeholder/schema files trackable; test synthetic filenames, never create real secret files.
- Pin the added Varlock packages only when integration starts. Upgrade TypeScript/Vitest/framework tooling in separate compatible groups where needed; document any temporary compiler-API exception. Do not use latest-version churn to postpone boundary tests.

**Acceptance:** frozen install, existing gates and builds pass; no high/critical audit findings; moderate findings have a recorded disposition; common secret/cache files cannot be accidentally staged in an exported app.

### S1 — Build one safe application workflow

**Depends on:** S0. **Scope:** smoke auth/config, schema/migrations, routes/server functions, tests. Audit: AR02, AR03, AR07, AR13.

- Replace public/in-memory demos with the owned-item workflow; remove unused scaffold routes/assets and optional API dependencies after checking callers.
- Validate input from `unknown`: bounded trimmed text, valid identifiers, and authorization on every read/write boundary. Scope database reads and mutations by session user; return a consistent not-found/denied response without leaking another user's item.
- Exercise real Better Auth and local D1, not mocked session-setting objects alone. Keep login/logout and session-expiry handling explicit. Production account recovery/email verification, abuse controls and product-specific policies remain a documented launch checklist; no fake email integration.
- Use a single Router/Query cache owner; invalidate the relevant cache after mutations and clear private data at logout/user change.
- Validate auth configuration at its real consumption point. Reject invalid origin, missing/weak/fixture secret on remote modes, without logging values. Local HTTP loopback remains supported deliberately.

**Acceptance:** browser sign-in → CRUD → sign-out works; anonymous requests and a second user cannot read/change the first user's items; malformed requests perform no write; local restart preserves intended D1 data; migrations work from empty D1. Test session expiry and mutation failure. Verify basic keyboard access, labels, focus/error states and responsive layout. Keep the existing shadcn lint positive/negative test.

### S2 — Integrate Varlock locally with no real secrets

**Depends on:** S1. **Scope:** `.env.schema`, pinned Varlock dependencies, Cloudflare Vite integration, config tests and package scripts. Audit: AR01, AR02.

- Use the official `@varlock/cloudflare-integration` for Start/Workers, not a generic environment wrapper assumed to populate Worker bindings.
- Resolve synthetic fixtures in test mode without initializing a Doppler client or requiring a service token. Prefer an explicit test configuration path supported by the pinned version; prove it rather than guessing schema syntax.
- Declare individual app variables. Do not bulk-export unrelated vault keys. Explicit declarations constrain exported configuration, but do **not** prove the plugin fetches only those secrets: its config-scoped API may retrieve the full configuration. Keep Doppler configurations minimal too.
- Mark the resolver token sensitive/internal. Verify it is excluded from child env, Worker bindings, generated config payloads, logs and client bundles. Inspect serialized runtime metadata as well as individually named secrets.
- Use `varlock load --agent --format json-full` for diagnostics through a trusted runner when real values are involved. Plain `json-full` can expose values. Test both stdout and stderr with distinctive fake-secret canaries.
- Preserve no-production-secret builds. If the pinned integration requires resolution during build, use fixtures/public target configuration and resolve real runtime secrets only in the separate approved deploy phase. Explicitly test this separation; never weaken it to make the plugin work.
- Detect conflicting `.dev.vars` files and document a controlled migration. Do not delete a developer's existing local values automatically.

**Acceptance:** local startup reads values through real Miniflare bindings; missing/malformed config fails; fixture mode performs no vault calls; secret canaries and token never appear in public bundles or diagnostics; selected public values do appear as intended. Regenerate Worker types **before** typecheck, then run tests/build. Failure leaves the candidate experimental.

**Delivered evidence:** exact `varlock@1.19.0` and `@varlock/cloudflare-integration@1.5.2`; no Doppler plugin/resolver; `@cache=disabled`; agent-safe diagnostics; invalid/missing-schema and canary tests; generated Worker types without `DOPPLER_TOKEN`; credential-free build plus post-build canary scan; real Vite/Miniflare startup and a signed synthetic Better Auth session. `db:remote` and `deploy` fail before Wrangler runs. Varlock's raw graph lists the **name** of an ambient internal override in `overrideKeys`, but omits its value and the item from `config`/child env; keep this visible for the S4 plugin review.

### S3 — Make the starter portable and continuously tested

**Depends on:** S2. **Scope:** example-local instructions, export recipe/script, CI and enforcement checks. Audit: AR08–AR12, AR14.

- Export from a selected committed revision using Git's native tracked-file facilities. Add only a small noninteractive wrapper if necessary for required renaming/provenance; no custom CLI framework. Reject a nonempty destination. Export never provisions resources or initializes production secrets.
- Supply local `AGENTS.md`, `STACK.md`, README and actual script references; no broken `../../docs` links after export. Include a compact local operating contract and pinned upstream links for deeper guidance.
- Make the project's name/bindings replacement explicit and validated; local startup must not require a remote D1 identifier. Keep remote provisioning a separate approval step.
- Export a usable unprivileged CI baseline with pinned actions, secret scan, dependency audit, tests and build. Keep any deployment workflow disabled/manual until the owner configures its protected environment. Do not copy the handbook's paths unchanged.
- CI tests the **exported app outside the handbook**, not just the source directory: frozen install, explicit local D1 setup, type generation, ship/build and HTTP/browser smoke. Verify Linux CI plus a local Mac run. The local test path needs no accounts; dependency downloads may still require network.
- Add negative checks for invalid instruction paths/commands, manifest drift, both YAML action `uses` forms and stale Worker bindings. Keep existing context checks read-only; generators are explicit preparation steps.

**Acceptance:** clean exported checkout works without parent docs, previous node_modules, Wrangler state, Doppler/Cloudflare credentials or global CLIs beyond the documented Node/pnpm/Git prerequisites. Export contains no secret/cache files and identifies its source revision. Repeating setup preserves data or explicitly selects disposable state; repeating export refuses overwrite. Validation leaves tracked source unchanged.

### S4 — Prove real Doppler development access

**Depends on:** S3 and **explicit authorization to create the pilot project/credentials**. No such action is authorized by this plan.

- Use one dedicated pilot application/config with fake service data. Trusted operator uses native Doppler commands; capture only names/status, never returned secret/token values in chat.
- Generate an internal auth secret with a cryptographic generator outside the agent transcript. Keep separate values per environment. Import supplier keys through trusted input only if a test truly needs them; no automatic provider account setup.
- Use a read-only config-scoped service token, bounded lifetime where operationally practical, held outside agent tasks. Confirm actual account entitlement and renewal procedure before promising OIDC or a zero-cost production design.
- Test wrong config, missing value, expired token, revoked token, provider outage and cache behavior against the pinned CLI/plugin separately. Doppler CLI fallback cache and Varlock/plugin caches are distinct. A revoked token does not revoke already retrieved supplier keys or erase caches.
- No `secrets:init` framework initially. Record the native procedure; build an idempotent create-only script only after repeated concrete friction. Initialization must not rotate, overwrite or delete existing values.

**Acceptance:** approved runner starts the app with real dev resolution; task agent cannot reach token/cache/prod; unrelated secret keys do not reach app output; invalid token/config fails without an unsafe fallback. Document authorized cache cleanup, recovery and explicit rotation. Report actual quota/cost; no reliance on future free-tier terms.

### S5 — Prove a disposable Cloudflare deployment safely

**Depends on:** S4 and **separate authorization for a named disposable Worker/D1, budget and cleanup**. A human or protected CI executes; the agent does not deploy under the current repo policy.

- Inventory target vars/secrets by name/classification, not plaintext. Compare desired schema and target before deploy. Block unexpected deletions until explicitly approved: `varlock-wrangler` owns the complete vars/secrets set, unlike an additive sync.
- Use a protected job on the reviewed exact commit/artifact. Dependency installation, build and untrusted tests must not receive production credentials. Changes to schema, workflows and deployment scripts require review because they execute with privileged resolution capability.
- Keep scoped CI tokens available in the trusted job; token-unsetting remains local OAuth policy, not a CI pattern. Test command construction first with a fake Wrangler executable (AR04). Declare the approved deployment command under the project's release contract before any permitted automation uses it.
- Verify the pinned integration's runtime blob excludes internal credentials; Doppler is not queried by deployed requests. Check binding/types compatibility and whether public configuration is build-time or runtime before reusing an artifact across environments.
- On the disposable target only, demonstrate that an approved extra dummy secret outside the schema is removed. Validate an updated secret after deployment and auth/CRUD over HTTPS. Do not call this test on an existing production Worker.
- Prove recovery: previous code/config artifact, migrations strategy and secret versions must be compatible. Old code alone cannot recover a revoked supplier key; auth-secret rotation may invalidate sessions. No automatic destructive D1 rollback.

**Acceptance:** inventory matches expected changes; no real secret leaks in job logs/artifacts/client responses; app works without vault access per request; recovery succeeds on the disposable target. Resources are cleaned only under the explicit agreed scope, with evidence. Cost recorded. Still no existing-app migration.

### S6 — Promote and adopt deliberately

**Depends on:** S0–S5 evidence and owner approval of the default change.

- Publish a tested starter release from one exact commit, with lockfiles, support matrix, concise changelog, bootstrap instructions, production checklist and known limits. Start with `0.x` experimental releases; call it stable only after complete acceptance, not after a successful build.
- Update active law, secrets/security docs, recipes, skills, README, example-local instructions and generated context in one coherent adoption change: Doppler/Varlock replaces Infisical for **new applications**. Retain documented project overrides for existing applications. Choose an independent scanner such as Gitleaks instead of retaining Infisical solely to scan.
- Keep schema/type generation and Worker declarations coherent. Do not retain obsolete Infisical and Varlock commands as competing defaults.
- Run a small agent exercise on the exported revision: bootstrap, add one owned field/feature, fix an intentional lint/validation error, and refuse a production-secret request. Judge by tests and forbidden side effects, not Jev agreement. Live model runs need a bounded approved budget; Jev remains optional triage.
- Record adoption on the first real new project. Existing apps migrate only with their own inventories, backups, approvals and regression checks.

**Acceptance:** every release gate below has evidence on the promoted revision; new projects know their origin and upgrade process; no unresolved blocker is disguised as an override.

## Release evidence checklist

- [ ] Dependency/security gate passes; remaining nonblocking advisories have owners and rationale.
- [ ] Real auth + owner-scoped D1 integration tests, malformed-input no-write, session expiry/logout and browser workflow pass.
- [ ] Frozen exported-app bootstrap and local test mode need no secrets/accounts; Linux and Mac evidence recorded.
- [x] Varlock local injection, config failure cases, secret/internal exclusion and client-bundle canaries pass (S2 fixture mode; no Doppler claim).
- [ ] Doppler entitlement, scoped access, expiration/revocation/cache/outage behavior and rotation are demonstrated.
- [ ] Approved disposable deployment, deletion inventory and recovery are demonstrated without unauthorized side effects.
- [ ] Generated types/context, links, scripts, lockfiles and instructions match; checks do not silently repair tracked files.
- [ ] Model-free CI, pinned actions, untrusted-PR credential exclusion and protected deploy job verified.
- [ ] Agent task exercise passes deterministic oracles; limitations and release provenance recorded.

Until S4/S5 are authorized, S0–S3 can deliver a valuable **local experimental starter**, but may not claim validated vault integration, deployed recovery or production readiness.

## Maintenance and downstream upgrades

- **Ownership:** one named maintainer approves releases, dependency groups, security exceptions and deprecations. Automation proposes changes; it does not self-approve sensitive migrations.
- **Cadence:** monitor security continuously; review compatible dependency batches weekly and platform/contract drift monthly. Recheck release evidence when its affected surface changes. Prefer fewer useful updates over formatter churn.
- **Versioning:** identify releases with immutable commits and a starter-specific tag convention (for example `starter-v0.1.0`). Never move published tags. Breaking bootstrap/schema/migration changes require explicit upgrade notes even during 0.x.
- **Upgrade delivery:** copied products receive no automatic file overwrite. Record their source version; provide release notes and targeted patches/migration instructions. Each product validates its own data, secrets and deployment assumptions. Add automation only after repeat use proves value.
- **Supported surface:** maintain one current tested app starter and one distinct Astro reference. Do not promise LTS for every historical snapshot. Flag unsupported snapshots and urgent security advisories explicitly.
- **Expansion trigger:** registry items/shared modules only after two real projects need the same stable module. R2/Queues/AI/API layers stay opt-in recipes until they justify tested reference code.

## Risks and stop conditions

- If Varlock cannot support secret-free builds plus correct runtime injection with the tested Start/Workers versions, stop the integration batch and document the incompatibility. Do not inject production secrets into builds as a workaround.
- If a free Doppler plan cannot satisfy the required identity/audit controls, present the paid cost or reduced scope for approval. Do not merge consumers behind an overprivileged token to save money.
- If sandbox tests cannot prove credential isolation, retain fixture-only agent tasks and trusted integration execution; do not label schema redaction a security boundary.
- If deployment inventory reveals unmanaged existing secrets, block migration. No blanket replacement of production vars/secrets.
- If a batch fails, keep the starter experimental and fix or revert that batch. No silent gate suppression or unrelated stack replacement.

## Source notes and implementation checks

Primary sources consulted during the preceding discussion; recheck their pinned-version behavior before implementation:

- [Varlock Doppler plugin](https://varlock.dev/plugins/doppler/): config-scoped service token, internal token type, explicit resolvers, shared API fetch/caching.
- [Cloudflare integration](https://varlock.dev/integrations/cloudflare/) and [Start integration](https://varlock.dev/integrations/tanstack-start/): local Miniflare injection, complete vars/secrets replacement, runtime metadata and deployment constraints.
- [Agent diagnostics](https://varlock.dev/guides/ai-tools/): `--agent` redaction; ordinary `json-full` must not enter an agent transcript.
- [Doppler service tokens](https://docs.doppler.com/docs/service-tokens): scope/expiration and CLI fallback-cache caveat.
- [Doppler limits](https://docs.doppler.com/docs/platform-limits): Developer currently documents 10 projects/50 service tokens; service accounts/identities have different entitlements. Confirm account pricing separately.

Registry candidates observed: Varlock `1.19.0`, Doppler plugin `2.0.1`, Cloudflare integration `1.5.2`. These are **not yet tested together in Fenod** and are not mandatory version pins until S2 proves compatibility.

## First implementation batch

Start with **S0**, then **S1**. No account access is needed. Preserve the working smoke baseline, fix security/configuration prerequisites, and establish the real authenticated D1 tests before adding vault machinery. Proceed through S2/S3 locally; pause for authorization before S4 and again before S5.
