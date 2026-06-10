# 001 — Deploy policy: Wrangler-first by default, Alchemy v2 (Effect) when the project demands it

| | |
|---|---|
| Status | DONE |
| Priority | 1 (highest) |
| Effort | M |
| Risk | Low (docs + skill only, no infra changes) |
| Written against | commit `4f918dc` |
| Depends on | nothing |
| Blocks | 002 (also edits deployment.md — land this first) |

## Why this matters

The handbook documents Alchemy v1 as the IaC layer. Two problems:

1. **The documented install is wrong.** `src/content/docs/deployment.md:115` says `pnpm add -D alchemy-framework`; the real npm package is `alchemy`. Any agent following the doc fails at step one. Same error in the French page (`fr/deployment.md:117,124`) and in `skills/fenod-cloudflare-deploy/SKILL.md:29`.
2. **Alchemy v2 is a rewrite on Effect** (https://v2.alchemy.run/ — `Cloudflare.Worker("Worker", {...})`, env typing via `Cloudflare.InferEnv`, OTel via Effect Layers). The v1 API documented here (`alchemy({ name, phase, run() })`) is the legacy line. Effect's learning curve conflicts with the stack's 80/20 solo-operator mode.

**Decision taken by the maintainer (do not re-litigate):** `wrangler.jsonc` + `wrangler deploy` is the default deploy path. Alchemy **v2** only when a project meets the triggers below. Alchemy v1 is never recommended for new work.

## Alchemy triggers (the policy to write, verbatim)

A project uses Alchemy v2 instead of plain Wrangler when **any** of these hold:

- 4+ Cloudflare resources whose lifecycle must be created/updated/deleted together;
- 3+ isolated stages beyond what Wrangler environments handle cleanly;
- infra-level tests or OTel wiring as code;
- multiple Cloudflare accounts.

Everything else (typical SME site/app: one Worker, one D1, maybe one R2): Wrangler only.

## Current state (verified at 4f918dc)

- `src/content/docs/deployment.md` structure: `## Cloudflare Hosting Default` (line 102, already Workers-first with the Pages nuance at 106 — keep it), `## Alchemy Setup` (108-~238, v1 API, wrong package at 115/122), `## Wrangler Commands` (240+, reference-style command list, not a default-path narrative).
- `src/content/docs/stack-contract.md:37`: `- Alchemy for Cloudflare IaC` (unconditional — must become conditional).
- `src/content/docs/fr/deployment.md` is a full 750-line translation; the publishing gate requires EN/fr alignment (or an explicit drift note, per `/freshness/`).
- `.env.example:88-93`: `STAGE`, `ALCHEMY_PASSWORD` presented as generic.
- `skills/fenod-cloudflare-deploy/SKILL.md`: "Alchemy quick pattern" block uses v1 API.

## Repo conventions to follow (from stack-contract.md and freshness.md)

- English is the Source Locale; update EN first, then the fr page or add an explicit drift note.
- Guide Shape for major guides: Default Path, Gotchas, Agent Notes, Related Guides.
- Bump `verified:` frontmatter to the current `YYYY-MM` on every page whose recommendation changes.
- Master verification gate: `pnpm check` (build + `check:links` + `check:public`).

## Steps

1. **Restructure `src/content/docs/deployment.md`:**
   - After `## Cloudflare Hosting Default`, add `## Default Path: Wrangler` — wrangler.jsonc anatomy, environments, `wrangler deploy`; fold the relevant parts of the existing `## Wrangler Commands` deploy material into it (the D1/KV/R2 command reference sections stay where they are).
   - Replace `## Alchemy Setup` with `## When to Use Alchemy` (the four triggers, verbatim) + `## Alchemy v2 Setup`. Install is `pnpm add -D alchemy`. **Fetch https://v2.alchemy.run/llms.txt at execution time** and write the minimal Worker + D1 example from current official docs. Do NOT carry over any `alchemy({ phase, run() })` v1 code.
   - Keep the Zod/Infisical/secrets sections untouched. Bump `verified:`.
   - Verify: `grep -c "alchemy-framework" src/content/docs/deployment.md` → `0`.
2. **`src/content/docs/stack-contract.md:37`** becomes: `- Wrangler for deploys by default; Alchemy v2 only for multi-resource/multi-stage projects (see [Deployment](/deployment/))`. Bump `verified:`.
3. **Add a Gotchas entry** in `src/content/docs/gotchas.md`: `## Alchemy v1 vs v2` — npm package is `alchemy` (not `alchemy-framework`); v2 is an Effect-based rewrite with a different API; v1 examples found online or in old docs will not work against v2.
4. **`skills/fenod-cloudflare-deploy/SKILL.md`:** add golden rule "Default deploy path is wrangler.jsonc + wrangler deploy; Alchemy v2 only on the IaC triggers in /deployment/." Replace the v1 quick-pattern block with the v2 example from step 1.
   - Verify: `grep -c "alchemy-framework\|alchemy({" skills/fenod-cloudflare-deploy/SKILL.md` → `0`.
5. **`.env.example`:** move `STAGE`/`ALCHEMY_PASSWORD` under `# Only for projects using Alchemy v2 (see /deployment/)`.
6. **French page:** mirror the deployment.md changes in `src/content/docs/fr/deployment.md` (and fr/gotchas.md, fr/stack-contract.md if they exist as full pages). If full translation is too costly in this pass, apply the freshness policy: make the EN changes and add the explicit translation-drift note to the fr page. Never leave `alchemy-framework` in fr: `grep -rn "alchemy-framework" src/` → empty.
7. **Run `pnpm check`** — must pass (links, public safety, build).

## Out of scope — do not touch

- The handbook site's own hosting (README "intended for Cloudflare Pages" + deployment.md:106 nuance) — that exception is deliberate and already documented; leave it.
- `docs/adr/` — this is a stack default, recorded in stack-contract, not a handbook-architecture ADR.
- recipes.md, agent-operating-contract.md, environment-secrets.md unless a sentence hard-asserts Alchemy as the only deploy path.
- No Effect evaluation, no real infra changes.

## Done criteria

- `pnpm check` passes.
- `grep -rn "alchemy-framework" src/ skills/ .env.example` returns nothing.
- deployment.md answers "one-Worker SME site, what do I do?" with Wrangler-only in the first screen of the deploy sections.
- The four triggers appear verbatim in deployment.md.

## Escape hatches

- If v2.alchemy.run docs are unreachable or the v2 example can't be verified against official docs: write everything else, leave `> TODO: v2 example pending docs verification` in the v2 section, report back. Do not invent v2 API code.
- If Alchemy v2 is still pre-release at execution time: document it as "evaluate when stable", triggers section unchanged.

## Maintenance note

Any future page showing a deploy command shows the Wrangler path first. Doc default changes propagate to the skill in the same commit.
