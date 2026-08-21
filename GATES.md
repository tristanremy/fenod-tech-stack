# Gates: official shadcn UI policy

- [x] G1: Agent-facing stack rules require the official shadcn CLI for components and blocks.
  CHECK: `pnpm check`
  EXPECT: generated context and contract-enforcement checks pass.
  EVIDENCE: passed 2026-08-21 — generated context and contract-enforcement checks passed.

- [x] G2: Human onboarding explains the same UI policy.
  CHECK: `pnpm check`
  EXPECT: contract-enforcement check validates the README and recipe.
  EVIDENCE: passed 2026-08-21 — README and recipe policy were validated.

- [x] G3: The smoke reference remains valid.
  CHECK: `cd examples/smoke && pnpm build`
  EXPECT: Workers client and SSR bundles build.
  EVIDENCE: passed 2026-08-21 — smoke client and SSR bundles built.
