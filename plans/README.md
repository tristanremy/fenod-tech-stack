# Stack maintenance plans

Plans are dated evidence and proposals, not authority. Current law is [the Stack Contract](../docs/stack-contract.md). Do not load this archive on ordinary product tasks.

## Current

- [009 — Agent-first audit, September 2026](009-agent-first-audit.md): findings, source-backed dependency/platform review, Shadcn Lint integration, Jev pilot and sequenced acceptance gates. **Audit delivered; starter promotion blocked on documented gaps.**

## Historical

These documents explain earlier decisions. Their commands, versions, paths and completion claims must be rechecked against the current repository. References to Starlight, French documentation or removed guides are historical, not current requirements.

| Plan | Topic |
| --- | --- |
| [001](001-deploy-policy-wrangler-default.md) | Wrangler-first deployment and Alchemy triggers |
| [002](002-observability-default.md) / [amendment](002b-observability-otel-amendment.md) | Observability |
| [003](003-rate-limiting-cloudflare-native.md) | Cloudflare-native rate limiting |
| [004](004-tsgo-ts7-api-constraint.md) | Earlier tsgo / TypeScript compiler API transition |
| [005](005-tanstack-db-spike.md) | TanStack DB/offline spike |
| [006](006-runtime-tooling-refresh.md) | Runtime/tooling refresh |
| [007](007-dependency-security-policy.md) | Dependency security policy |
| [008](008-drizzle-v1-posture.md) | Drizzle v1 posture |

## Maintaining a plan

Record the baseline revision, dated sources, observed checks, unresolved risks and executable acceptance criteria. Separate completed changes from proposals. Update matching active contracts/skills only when a decision is actually adopted. Generate agent context explicitly with `pnpm llms:build`; `pnpm check` verifies without rewriting it.
