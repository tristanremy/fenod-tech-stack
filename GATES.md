# Gates: stack security and agent-factory hardening

- [x] G1: Contract-facing files enforce the new security and deployment rules.
  CHECK: `pnpm check`
  EXPECT: generated context and contract-enforcement checks pass.
  EVIDENCE: passed 2026-08-21 — generated context, defaults, and enforcement checks passed.

- [x] G2: The smoke reference validates the Workers build and generated bindings.
  CHECK: `cd examples/smoke && pnpm cf-types && pnpm build`
  EXPECT: type generation and Workers build pass.
  EVIDENCE: passed 2026-08-21 — Wrangler generated bindings and Vite built client/SSR bundles.

- [x] G3: The documented agent-factory guidance is internally consistent.
  CHECK: `pnpm check`
  EXPECT: the contract-enforcement check validates its required documents and CI rules.
  EVIDENCE: passed 2026-08-21 — contract-enforcement check passed.
