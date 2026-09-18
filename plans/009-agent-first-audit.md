# Fenod agent-first audit — 2026-09-18

Status: **audit and first improvements delivered; production-starter promotion blocked**.
Baseline: `703a9599eaaa0d932efe141852928aec05b2a490`, branch `feat/astro-reference`.
This is a dated assessment and execution plan, **not a second Stack Contract**. Read it when maintaining Fenod, not on every product task.

## Decision

Keep the core stack. Its largest weakness is not a missing framework: **the executable reference, instructions and enforcement disagree**. Make one small authenticated application reproducible and safe before adding more platform capabilities.

The target is an agent that can start from a pinned Git revision, select the right example, bootstrap locally without credentials, implement a feature, receive actionable failures, prove it works, and stop at production boundaries. “Best for agents” means a measured task-success rate—not the largest prompt, most models or newest dependencies.

## Evidence and limits

- Parent inspected contracts, scripts, manifests, resolved dependencies, CI and selected real request/configuration paths; ran local checks and registry/security queries.
- Independent read-only audit: **`openai-codex/gpt-6-astra:max`**, run `e5a97ab2-ea49-4761-8061-1806379c4faf`. Fourteen findings, summarized below. It inspected a moving worktree while the parent added linting; it is not an independent approval of the final patch.
- External research used official documentation, release notes and registry metadata. A separate research child failed because its web-tool providers were unavailable; it supplied no independent current-source verification. Workflow: `8825c606-123d-4e4c-902d-7a953bae6728`.
- Two bounded Jev requests used synthetic/public summaries, not repository dumps or credentials. They establish API connectivity, not reviewer accuracy. See [pilot evidence](../docs/agent-evals.md).
- No Cloudflare account configuration, deployment, remote migration, live product data, end-to-end login test or clean exported-app startup was performed. No production readiness claim follows from passing unit tests.

### Baseline checks

| Check | Observed result |
| --- | --- |
| Root context/default/enforcement scripts | Pass, despite semantic gaps below |
| Smoke `pnpm ship` | Pass: 2 files, 5 tests, only Node config/auth settings |
| Astro `pnpm ship` | Pass: 7 generated-HTML tests, production and preview builds |
| Root `pnpm audit --audit-level high` | Pass threshold; 1 low advisory |
| Astro audit | No known vulnerabilities returned |
| Smoke audit | **Fail: 2 high, 6 moderate** |
| `pnpm outdated --format json` in both examples | Reports available updates; exit 1 means updates found, not an install failure |

This table is the pre-change snapshot. A later S0 batch repaired the secret ignores and the two high advisories; see the disposition column below for current status.

Strengths worth preserving: one-package default; D1/Workers fit; short feature slices; explicit production boundaries; pinned CI action SHAs; real Astro HTML assertions; concrete D1 race, R2 lifecycle and query-count recipes. Do not replace them with an orchestration framework.

## Findings and disposition

“Static” means inspected code/configuration, not a runtime reproduction. Severity refers to the risk of copying this reference into future products, not proof of an exploited deployed vulnerability. AR identifiers come from the independent audit; SEC01 is the parent's package audit.

| ID | Priority / evidence | Finding and consequence | Disposition |
| --- | --- | --- | --- |
| SEC01 | P1 / package audit | `examples/smoke/pnpm-workspace.yaml` pinned `js-yaml` 4.3.1; `@cloudflare/vite-plugin → miniflare → sharp` was also affected. High advisories [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) and [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c). | **Fixed for high.** `js-yaml` 4.3.2 and `sharp` 0.35.4 overrides, `hono` bumped to `^4.13.8`, and a scoped `@esbuild-kit/core-utils>esbuild` override. Verified on a clean `--frozen-lockfile` install plus ship/build/`db:generate`; `pnpm audit --audit-level high` now exits 0. Remaining moderate: Vitest `GHSA-82fw-gwwq-j7x9` needs major 4.1.11+ (deferred to the batch D Vitest migration, devDependency only). Temporary overrides must be re-evaluated at each dependency batch; they are not a permanent fix. |
| AR01 | P1 / static, needs startup reproduction | Preferred `infisical run -- pnpm dev` injects process variables, but `src/lib/auth.ts` reads Worker bindings; `wrangler.jsonc` declares no secret import. Installed Wrangler 4.122 defaults process-env inclusion off. Local dotenv can conceal this. | **Open.** Declare only required secrets using supported Wrangler configuration; prove env-only startup. Do not import the entire host environment. |
| AR02 | P1 / static | `src/env.ts` only validates `NODE_ENV`; auth separately checks secret presence and defaults origin to localhost. Claimed Worker Zod validation is not exercised. | **Open.** Validate the configuration auth actually consumes, including production origin and secret policy. |
| AR03 | P1 / static | `src/routes/demo/drizzle.tsx` uses an identity validator with a TS annotation. Browser checks are not runtime boundary validation. | **Open.** Parse bounded input from `unknown`; test no insert on rejection. Public demo is not an authenticated product pattern. |
| AR04 | P1 / static | Smoke `deploy`/`db:remote` scripts unset the token that approved CI needs. Local OAuth troubleshooting and CI authentication are conflated. | **Open.** Separate local OAuth from CI token commands; verify with a fake CLI, never a real deploy. |
| AR05 | P1 / static | Root and smoke ignores missed common dotenv variants (`.dev.vars.staging`, `.env.production`) plus the `.tanstack` cache; Astro's own `.gitignore` only ignored `dist-preview/`, relying on its parent. | **Fixed.** Self-contained rules in all three files, `examples/**` backups at root, placeholder/declaration files still trackable, and `.pi/release.json` un-ignored for a future deploy contract. `scripts/secret-ignores.test.mjs` checks synthetic paths with `git check-ignore --no-index` and fails if a secret path or a tracked secret regresses. |
| AR06 | P1 / manifests + registry | Law says TS7/Vitest5/Zod4.5; smoke uses native-preview/TS5.9, Vitest3.2.7, Zod4.4.3. README/skills also prescribed tsgo. | **Partial.** README/skills aligned; executable migration remains open. Astro's TS6 compiler-API requirement is valid, not indiscriminate upgrade debt. |
| AR07 | P1 / static | `src/server/app.ts` resolves sessions for RPC but always passes `session: null` to OpenAPI; both expose `whoami`. Bearer documentation does not implement bearer auth. | **Open.** Remove unused transport or authenticate it consistently; test both denial and success. |
| AR08 | P2 / static | Copying only an example loses root `AGENTS.md`, CI/security setup and `../../docs` links. `cp -R` can copy local data/secrets. | **Open.** Tracked-file export with portable project instructions and pinned upstream revision; credential-free bootstrap. Warning added now. |
| AR09 | P2 / script inspection | Root instructions advertised absent `lint`/`typecheck`/`test` scripts and generated commands omitted scope. | **Fixed for advertised gates.** Handbook and example commands now name the correct directory; root test exists. A general command-manifest validator remains future work. |
| AR10 | P2 / behavior + negative tests | `pnpm check` regenerated context before checking it, hiding stale committed files. `check:context` only parsed JSON. | **Fixed.** Non-writing exact comparison, route-target existence checks, missing/stale-output and determinism regression tests; explicit regeneration command. Not yet a general Markdown/schema validator. |
| AR11 | P2 / path inspection | Skills pointed to removed tooling, testing, live-query, React and deployment guides. | **Fixed known references.** Replaced with existing recipes/examples. Comprehensive link/anchor validation remains open. |
| AR12 | P2 / CI order | CI typechecks before regenerating Worker bindings, then builds without re-typechecking. | **Open.** Generate bindings before ship gate; test a deliberately renamed binding. |
| AR13 | P2 / docs | Server-functions-first law conflicts with unconditional oRPC in the scaffold command and Hono/oRPC in smoke. | **Open.** Separate minimum app and optional API-boundary recipe. Test the actual scaffold options before changing them. |
| AR14 | P2 / checker inspection | Action-pinning regex misses valid YAML `- uses:` syntax. Current actions are pinned. | **Open.** Negative fixtures for both YAML forms; no need for a generic policy engine. |

## First changes in this audit

1. **`@shadcn/lint` 0.1.1 + Oxlint 1.83.0** in smoke, lockfile included. `no-restyle` permits layout at call sites and lets `src/components/ui` own variants. Existing React rules and demo exclusions remain. A real CLI regression test proves permitted Button layout succeeds and `p-4` fails with `no-restyle`. No UI rendering was changed.
2. **Read-only generated-context verification.** `pnpm llms:build` is the explicit writer; `pnpm check` compares committed content and includes the generator regression test. Missing route targets fail. No parallel hand-maintained manifest was added.
3. **Truthful entrypoints and focused skills.** Correct gate scopes, known broken reference cleanup, clear warning that smoke is not production-ready, and task routing to UI config and the Jev pilot. Historical plans are marked historical rather than reloaded as law.
4. **Jev evaluation recipe and this prioritized plan.** No new app AI runtime, live CI judge, model-orchestration framework, registry or database migration.
5. **S0 starter prerequisites** (follow-up, tracked by [plan 010](010-maintained-starter.md)): dependency advisories repaired, self-contained secret ignores, and an experimental status table. No app behaviour changed yet.

Shadcn's upstream setup defaults to registration only; enabling this single rule is a deliberate Fenod policy decision, not an upstream mandatory preset. Raw colors, arbitrary values, inline styles and other rules remain opt-in after design decisions. Oxlint JS plugins are still alpha; pin/test the integration. Transitive parser packages are not a second ESLint command. This linter does not prove accessibility, visual quality or correctness.

## Dependency refresh: tested baseline versus candidates

Snapshot from local resolved packages and registry `pnpm outdated` on 2026-09-18. Candidate means **available, not compatibility-validated**. Update in small groups; keep Node 24. Do not infer a security patch from a higher version number.

| Area | Smoke installed at baseline → candidate | Recommendation |
| --- | --- | --- |
| Start / Router / router CLI | 1.168.32 → 1.168.56 / 1.170.18 → 1.170.38 / 1.167.21 → 1.167.38 | Patch together with SSR/query adapters and route generation; exercise server boundaries and hydration. |
| Router devtools / SSR Query | 1.167.0 → 1.167.2 / 1.167.1 → 1.167.3 | Keep compatible with Router, not an independent feature project. |
| Query + Query devtools | 5.101.4 → 5.103.1 | Adopt after cache/preload/logout tests; existing recipes already identify the important failure modes. |
| TanStack React devtools / Vite devtools | 0.10.9 → 0.10.12 / 0.8.3 → 0.8.5 | Maintenance, low priority; devtools do not belong in production evidence. |
| Better Auth | 1.6.27 → 1.7.5 | Review upgrade guide, schema, sessions, account identity and installed plugins. A minor release can need migration; do not blindly widen/update auth. |
| All six direct oRPC packages | 1.15.0 → 1.15.1 | Update as a group after resolving transport/session consistency. |
| Hono | 4.13.2 → 4.13.8 | Review advisories/changelog; preserve only if the API boundary is actually needed. |
| Drizzle ORM / Kit | 0.45.2 / 0.31.10; no update returned by this snapshot | Keep stable 0.4x policy. v1 RC is not a default migration. Test D1 semantics, not only ORM types. |
| Cloudflare Vite plugin / Wrangler | 1.52.0 → 1.55.0 / 4.122.0 → 4.134.0 | Review Miniflare transition and security fixes as one compatibility group; regenerate bindings before checks. |
| TypeScript | native-preview 7.0.0-dev.20260707.2 + API 5.9.3 → stable 7.0.2 | Explicit migration. TS7 has no stable compiler API; use documented TS6 compatibility alias for parser/framework consumers when necessary. |
| Vitest | 3.2.7 → 5.0.1 | Follow v4 and v5 migration guides; validate Worker test integration before promotion. |
| Vite / React Vite plugin | 8.1.5 → 8.3.0 / 6.0.4 → 6.1.1 | Bundling/SSR regression gate, no architectural rewrite. |
| React / React DOM | 19.2.8 → 19.3.0 | Upgrade together with types; test SSR/hydration/auth UI. |
| React / DOM types | 19.2.17 / 19.2.3 → 19.3.0 | Pair with runtime upgrade. |
| Zod | 4.4.3 → 4.6.5 | Law still explicitly says 4.5.x. Choose/test the target and update the contract deliberately; first fix missing runtime validation. |
| Tailwind / plugin | 4.3.3 / 4.3.3; no newer version returned | Keep; lint policy is the useful change, not a styling rewrite. |
| tailwind-merge | 3.6.0 → 3.7.0 | Verify class conflict behavior with Tailwind/component variants. |
| Lucide | 0.577.0 → 1.47.0 | Major-version review, not security-driven churn. |
| Oxlint / Oxfmt | 1.79.0 → 1.83.0 / 0.63.0 → 0.68.0 | Oxlint updated for shadcn. Defer formatter churn to a separate reviewed diff. |
| Utility/UI packages | CVA 0.7.1, clsx 2.1.1, Radix 1.6.7, tw-animate-css 1.4.0 | No newer version returned in the snapshot; no reason found to replace them. |
| Node types | 24.13.3 → registry latest 26.6.1 | **Do not follow latest** across runtime majors. Stay on Node24 types. |

Astro reference: Astro 7.3.1 → 7.3.3, Vitest 5.0.0 → 5.0.1, Oxlint 1.82.0 → 1.83.0, Oxfmt 0.67.0 → 0.68.0 are maintenance candidates. `schema-dts` 1.1.5 → 2.0.0 needs a major review. Keep TS6.0.3 while `astro check` needs its compiler API. Sharp 0.35.4 is already present; Astro audit returned clean. Cheerio 1.2.0 and `@astrojs/check` 0.9.10 had no newer entry in the snapshot.

The root has only development tooling (`tsx` plus Node types added for typed scripts). Products should inherit tested lockfiles, not this table's future moving `latest` values.

## Useful platform changes—not an adoption shopping list

| Official change | Fenod consequence | Decision |
| --- | --- | --- |
| [Worker-scoped roles, Sep 15](https://developers.cloudflare.com/changelog/post/2026-09-15-granular-worker-permissions/) | Metadata Read-Only for approved diagnostics; Content Read-Only only when code access is needed; Editor for protected CI. DO permissions inherit their owning Worker. Logs can still contain sensitive data. | Adopt in next account/security review; **no account changes here**. Never infer permissions for D1/R2 from a Worker role. |
| [D1 free daily quota enforcement, Sep 1](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/) | Queries fail until midnight UTC after free-plan row quotas. Query counts alone do not measure rows scanned. | Add quota/error fixtures, rows-read monitoring and `EXPLAIN`/indexes. Paid-plan decision belongs in project capacity review. |
| [AI Gateway BYOK-only, Sep 14](https://developers.cloudflare.com/changelog/post/2026-09-14-require-provider-credentials/) | Can prevent fallback to Cloudflare Unified Billing when provider credentials are missing (`byok_only`). Workers AI billing is separate. | Recommend for approved BYOK production gateways after failure-path testing; not enabled by this audit. |
| [Workflows subscriptions, Sep 15](https://developers.cloudflare.com/changelog/post/2026-09-15-instance-event-subscriptions/) | History + live events can replace status polling. Authorization, cursor/reconnect behavior and event redaction still needed. | Pilot only for real long-running workflow UX; not a reason to add Workflows to CRUD. |
| [Workflows retention, Sep 10](https://developers.cloudflare.com/changelog/post/2026-09-10-paid-retention-default/) | New paid Workflows retain completed/error state seven days by default instead of thirty. | Set explicit retention/recovery requirements; do not use execution history as a permanent business ledger. |
| [R2 access logs, Sep 4](https://developers.cloudflare.com/changelog/post/2026-09-04-r2-data-access-logs/) | Useful object-operation diagnostics, but asynchronous/best effort, successful operations only, and non-jurisdictional buckets. | Optional observability; never the authoritative audit trail or reason to relax residency constraints. |
| [Worker RPC session spans, Sep 17](https://developers.cloudflare.com/changelog/post/2026-09-17-javascript-rpc-session-spans/) | Better traces across Workers/DO. | Use when such boundaries exist; do not split one Worker to obtain tracing. |
| [Larger Worker bundles, Sep 4](https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/) | More headroom, not permission for dependency bloat or guaranteed startup performance. | Retain measured bundle/startup budgets. |
| [TanStack AI RC, Aug 21](https://tanstack.com/blog/tanstack-ai-rc) | AG-UI protocol and richer provider/tool ecosystem; release-candidate status still matters. | Keep chosen direction, pin and test an AI vertical slice. Explicitly document RC risk before a product depends on it. |
| [Reliable Query prefetching](https://tkdodo.eu/blog/reliable-query-prefetching-with-tanstack-router) | Shared query options and loader dependencies avoid loader/component drift. | Add executable loader/preload examples to the existing cache recipe. No new state library. |
| [Oxc type-aware stable](https://oxc.rs/blog/2026-07-22-type-aware-linting-stable) | Stronger promise/type-aware feedback becomes practical with TS7. | Pilot after the TS7 baseline migration, measure noise/time, then enable useful rules. |
| [Jev via Vercel, Sep 16](https://vercel.com/changelog/typesafe-ai-jev-now-available-on-ai-gateway) | Cheap typed evaluation through a distinct API modality. | Optional evidence triage pilot, never authorization or release authority. |
| [Infisical Linux repository migration](https://infisical.com/docs/cli/cloudsmith-migration) | CLI notice says the old Cloudsmith repository stopped serving Sep 16. Linux CI/container installs must use `artifacts-cli.infisical.com`; Homebrew is unaffected. | Check downstream CI provisioning before reuse. No machine/package-source change performed here. |

No September Queues-specific update was found in the consulted [changelog](https://developers.cloudflare.com/changelog/product/queues/); this is a search observation, not proof no changes occurred. R2/KV/Queues/Durable Objects/Alchemy remain trigger-based. Do not add TanStack DB, RSC, Code Mode, MCP servers, vector search or sandboxes without a concrete workload and security model. This audit did not establish a product need for them.

## Execution plan and acceptance gates

Each batch is one owner, small conventional scoped commits, no production credentials, no unrelated version sweep. Acceptance below is future work unless explicitly marked delivered above.

### A. Repair the reference's boundaries — first, blocks starter promotion

**Files:** smoke auth/env, D1 service/server function, transport handlers, Wrangler configuration, ignores and affected dependency overrides.

1. Reproduce env-only startup in a disposable copy with fixture secrets. Validate required Worker config; distinguish development and production without secret-value logging.
2. Make one real D1 CRUD flow authenticated, runtime-validated and owner-scoped. Remove or clearly isolate unsafe/in-memory demos from the copyable baseline. Test actual HTTP and local D1 behavior, not only configuration objects.
3. Remove unused OpenAPI or implement consistent sessions and truthful auth documentation. Do not bolt on a second auth system.
4. Fix secret/artifact ignores in root and both standalone examples. Use `git check-ignore --no-index` on synthetic filenames; placeholder examples must remain unignored.
5. Repair both high dependency findings, review moderates, and test the supported dev/build surfaces. Do not suppress the audit.
6. Separate CI-token and human-OAuth command construction. Test with a fake Wrangler executable. Local agent Wrangler calls still unset tokens under the existing policy; no actual remote operation belongs in this validation.

**Exit:** clean local startup, real session success/denial, malformed-input no-write, owner isolation, empty DB migration, restart persistence, audit below high, `ship` and build green. No production claim if one gate is missing.

### B. Produce a portable agent seed — depends on A

**Files:** example-local `AGENTS.md`, export/bootstrap script only if necessary, example READMEs and instruction links.

Export tracked files from a chosen revision, not arbitrary local directories. Include portable instructions with an immutable upstream contract reference, a clear project override mechanism and required CI/secrets checklist. Separate “minimum Start app” from “API boundary” and “Astro site”; no generator framework or day-one monorepo.

**Exit:** in a temporary directory outside this handbook, frozen install → local migrations → checks → startup works without the parent docs, a Cloudflare account, production credentials, stale node_modules or `.wrangler`. Re-running setup is safe. Confirm no secret/state files are exported. Verify the same process on Linux CI, not only this Mac.

### C. Make drift mechanically visible — small independent follow-ups

Extend existing checks rather than create a policy engine: validate `{cwd, command}` against package scripts; resolve supported local Markdown paths/anchors; compare tested versions and explicit exceptions; catch both action `uses` syntaxes; regenerate Worker bindings before typechecking. Keep generation and verification separate.

**Exit:** known-bad fixtures fail for stale context, missing route, invalid manifest, missing script, unpinned action, version drift and renamed binding. Checks leave repository file hashes unchanged. The delivered generator test already covers stale/missing context and route targets.

### D. Upgrade the toolchain in compatible groups — after baseline evidence

1. TS7 stable plus only necessary TS6 API compatibility; prove parser, Drizzle Kit and framework tools still load. This also matters for shadcn's parser dependencies.
2. Vitest5 and real Worker/D1 integration tests.
3. Start/Router/Query + Cloudflare/Vite compatibility group.
4. Better Auth upgrade with explicit schema/session tests and migration review; no remote migration.
5. React/UI and Astro maintenance as separate diffs; formatter upgrade separate from behavior changes.

**Exit per group:** frozen lockfile, relevant negative/integration tests, ship, bindings and build, dependency audit. Record tested versions and deviations; update law only after proof. Revert the group if its acceptance fails rather than adding untested compatibility wrappers.

### E. Measure agent performance — after B/C

Use the [small task corpus](../docs/agent-evals.md). Start with two representative agents and a few repeated runs per case, fixed model settings and budgets. Compare existing full context versus short task-routed context. Independent deterministic oracles judge correctness and safety; Jev may triage evidence, never grade its own rubric as proof.

**Metrics:** completed tasks, false-success claims, unauthorized-action attempts, needless dependencies, retries, selected context size, elapsed time and cost. Report distributions and failures, not a single “agent-readiness score”. Hold out tasks when tuning instructions. Add more models only when the comparison answers a real question.

**Exit:** no regression in correctness/safety; demonstrated benefit or remove the extra context/tool. Require **zero forbidden side effects** as a gate; reduced tokens cannot compensate for failed authorization.

### F. Continuous freshness without constant churn

Renovate already exists; verify it is actually enabled remotely rather than assuming the file proves operation. Review security updates promptly, group compatible package families, keep auth/ORM/RPC and pre-1.0 minors manual. Monthly maintenance: registry snapshot, advisories, relevant platform changelogs, and local gate evidence. A `verified:` date must link to evidence, not merely be bumped.

Keep a dated maintenance report out of the default prompt. Promote a release only after B–E evidence; record upstream commit and tested lockfiles for each consumed starter. No private credentials, machine-specific paths or compulsory global CLI should be required by a downstream agent.

## Verification of this change

- `pnpm check`: passes; includes the new deterministic/read-only generator regression test and existing contract checks.
- `pnpm --dir examples/smoke ship`: passes, now **6 tests** including real positive/negative Oxlint CLI calls.
- `pnpm --dir examples/smoke build`: client and Worker SSR bundles pass, repeated successfully.
- `pnpm --dir examples/astro ship`: passes, **7 tests**, both build modes; Astro files were not changed.
- Standalone compiler check of `scripts/generate-llms.ts`: passes with the installed compiler and root Node types. LSP reported no errors; one file in the final batch was inconclusive, so that batch alone is not a clean bill of health.
- `git diff --check`: passes. Generated outputs are compared byte-for-byte, and the regression test generates twice to prove determinism.
- Smoke dependency audit remains **2 high + 6 moderate**. This patch does not close SEC01, certify the starter, test login in a browser or validate the proposed migrations.

## Additional source register

Sources consulted 2026-09-18; mutable pages/registry metadata are snapshots, not future guarantees.

- [Shadcn Lint README](https://github.com/shadcn-ui/lint), [setup](https://github.com/shadcn-ui/lint/blob/main/SETUP.md); package metadata checked with `pnpm view @shadcn/lint@0.1.1`.
- [TypeScript 7 release and TS6 compatibility aliases](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
- [Vitest 5 release](https://vitest.dev/blog/vitest-5.html), [migration guide](https://vitest.dev/guide/migration/).
- [Better Auth 1.7](https://better-auth.com/blog/1-7), [upgrade guide](https://better-auth.com/docs/guides/1-7-upgrade-guide), [security update](https://better-auth.com/blog/security-update-june-2026).
- [Drizzle releases](https://github.com/drizzle-team/drizzle-orm/releases); stable-versus-RC must be rechecked at migration time.
- [Vercel evaluation modality](https://vercel.com/docs/ai-gateway/modalities/evaluation), [TypeSafe introduction](https://docs.typesafe.ai/introduction.md).
- Context-file studies give **mixed results**: [task success/cost](https://arxiv.org/abs/2602.11988), [runtime/output tokens](https://arxiv.org/abs/2601.20404). Their different tasks and measures do not establish a Fenod outcome; run local evaluations.

**Production action required for this audit: none.** Future app releases remain blocked on their own authorization, security, bootstrap and deployment gates. The plan does not authorize account changes or deployment.
