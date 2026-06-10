# Plans — Stack audit, June 2026 (rebased)

Written against commit `4f918dc` ("docs: add Fenod agent skills") after the Starlight migration (`e814d33`). Each plan is self-contained. Update Status as you go (TODO → IN PROGRESS → DONE / BLOCKED + one-line note).

## Execution order and status

| # | Plan | Effort | Depends on | Status |
|---|------|--------|------------|--------|
| 001 | [Deploy policy: Wrangler-first, Alchemy v2 on triggers](./001-deploy-policy-wrangler-default.md) | M | — | DONE — Wrangler default, Alchemy v2 trigger policy documented |
| 002 | [Default observability (Workers Logs + optional Sentry)](./002-observability-default.md) | S | 001 | DONE — Observability page and deploy checklist added |
| 003 | [Rate limiting: Cloudflare-native, drop Redis](./003-rate-limiting-cloudflare-native.md) | S | — | DONE — Redis env removed, Workers binding recipe added |
| 004 | [tsgo / TypeScript 7 API constraint](./004-tsgo-ts7-api-constraint.md) | S | — | DONE — side-by-side TypeScript rule documented |
| 005 | [Spike: TanStack DB for offline-first](./005-tanstack-db-spike.md) | M (1-day timebox) | — | DONE — research spike recorded as Wait |

003 and 004 parallelize with 001. 005 runs whenever.

## Conventions every plan follows (from the handbook itself)

- English is the Source Locale: EN first, then fr page or explicit drift note (`/freshness/`).
- Bump `verified:` frontmatter on every page whose recommendation changes.
- Master gate: `pnpm check` (build + internal link check + public-safety check). Targeted greps are listed per plan on top of it.
- Doc default changes propagate to the matching `skills/` SKILL.md in the same commit.

## Decisions already taken (do not re-litigate)

- **Deploy policy** (maintainer, June 2026): Wrangler default; Alchemy **v2** only on the IaC triggers in plan 001. Alchemy v1 dead for new work.
- **Observability**: two tiers — Workers Observability mandatory everywhere, Sentry added for product apps.

## Resolved since the original audit (by `e814d33`/`4f918dc` — no plans needed)

- CI with link check and public-safety check (was hygiene finding #1/#2; the `audrain-patrimoine` leak is gone).
- Pages-vs-Workers staleness: stack-contract.md:32 and deployment.md:106 now state Workers-first with a deliberate Pages exception for already-connected static projects.
- Freshness dates: `verified:` frontmatter + `/freshness/` policy exist.
- Agent entry points: ai-index, stack-contract, agent-operating-contract, gotchas, recipes, llms.txt.
- fr/ fate: decided — full bilingual handbook with EN as Source Locale and a drift-note mechanism.

## Considered and rejected

- **Replacing core stack pieces** (TanStack Start, Hono, ORPC, Drizzle, D1, Better Auth): audited June 2026, healthy. Start hit 1.0; D1 gained read replication (Sessions API).
- **Redis for anything**: contradicts the Cloudflare-first stack (plan 003).
- **Effect as a general stack direction**: contained to Alchemy-v2-triggered projects only (learning curve vs 80/20 operating mode).
