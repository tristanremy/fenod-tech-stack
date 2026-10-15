---
title: "Review Guide"
description: "Agents write the code, the maintainer reviews it. What agents put in every PR, and how the maintainer reads it."
verified: 2026-10
---

Fenod code is written by agents and reviewed by the maintainer. Review time is the bottleneck, so agents hand over a **review packet** and the maintainer reads in a fixed order, from cheapest to most expensive. Applies to every lane.

## Review packet (agent, in every PR description)

For an activated guarded-main project, put the same packet in a commit-linked release record when there is no PR. Low-risk changes use standing owner approval; sensitive changes still receive human review before production. See [guarded main](recipes.md#guarded-main-and-rollback).

Short, factual, no marketing. Sections with nothing to report say `none`.

**Short form** for PRs that change no runtime code (docs, formatting, lockfile-only patch updates with a clean audit): Intent, Verification run, Not verified, Production action. Dependency upgrades that change a `package.json` version, config, or source use the full packet.

1. **Intent.** One or two sentences: what changes for the user or the system.
2. **Public surface.** Every new or changed exported signature, schema, route, ORPC procedure, or Effect service interface, as `file:line` with one line on what changed. The diff is the source of truth; do not paste code that can drift from it.
3. **Boundaries.** Where unknown data is now parsed (`file:line`) and with which schema.
4. **Errors.** New or changed codes / tags: status, `retryable`, where translated. Checked against [errors.md](errors.md).
5. **Assertions and suppressions.** Every `as` (other than `as const`), `SAFETY` block, `oxlint-disable`, `@ts-expect-error`, with its reason. Target: none.
6. **Dependencies.** Added or upgraded packages, new bindings, new secrets names, new Layers (Effect lane).
7. **Tests.** Test names added or changed, and the behavior each one pins.
8. **Verification run.** Commands and results.
9. **Not verified.** What the agent could not check and why: the riskiest assumption, stated plainly. "Everything verified" is only allowed when it is literally true.
10. **Production action.** Migrations, secrets, DNS, deploys still needed by a human.

## Reading order (maintainer)

Stop as soon as something is wrong and send it back.

1. **Packet.** If it is missing, vague, or contradicts the diff, request changes without reading code.
2. **CI.** Red CI means no review.
3. **Types and schemas.** Read only signatures, schemas, error definitions. Do they say what the intent says?
4. **Error translation sites.** Explicit per code or tag, no catch-all for expected failures.
5. **Test names.** Do they cover the intent and the "not verified" item?
6. **Bodies, only where needed.** The "not verified" item, anything section 5 of the packet lists, and the always-read list below.

## Always read in full

- auth, sessions, permissions, multi-tenant filters
- payments, invoices, anything with money
- data deletion, D1 migrations, backfills
- secrets handling, AI tools that act (send, delete, pay), prompt-injection exposure
- anything the packet marks as uncertain

## Send back without discussion

- a cast, `any`, or `!` without a `SAFETY` block (Oxlint already rejects the bare form in every lane)
- a catch-all that turns expected failures into one generic error
- parsing the same value twice, or untyped data passed past its boundary
- a new dependency, stack choice, or architecture shape not asked for
- tests that only restate a schema or only assert that a mock was called
- a public error message with internals, or a `retryable: true` that is not provably safe

## Keeping review cheap over time

When the same comment appears twice, turn it into a lint rule, a type, or a line in the matching doc. Prose is for judgment calls. Anything mechanical belongs in Oxlint or TypeScript.
