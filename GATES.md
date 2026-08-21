# Gates: compact agent context

- [x] G1: Agents can route tasks from one compact index.
  CHECK: `pnpm check`
  EXPECT: generated context and route checks pass.
  EVIDENCE: passed 2026-08-21 — compact route index generated and enforcement passed.

- [x] G2: The compact machine-readable context is valid and complete.
  CHECK: `pnpm check:context`
  EXPECT: JSON parses successfully.
  EVIDENCE: passed 2026-08-21 — agent-context.json parsed successfully.

- [x] G3: Existing smoke proof still builds.
  CHECK: `cd examples/smoke && pnpm build`
  EXPECT: Workers client and SSR bundles build.
  EVIDENCE: passed 2026-08-21 — smoke client and SSR bundles built.
