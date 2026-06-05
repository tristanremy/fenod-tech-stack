# Stack Overview

[Disponible en francais](./fr/STACK-OVERVIEW.md)

This is the operating view of the Fenod stack: what should be primary, what is optional, and how the local machine setup maps to day-to-day delivery.

## What This Stack Optimizes For

- Type-safe product development with minimal ceremony
- Fast iteration for small teams shipping to the edge
- Reusable patterns across apps, content sites, internal tools, and AI features
- AI-assisted development with strong constraints instead of loose code generation
- A default path that is simple enough to teach and fast enough to ship with

## Default Choices

| Layer | Default | Why |
|-------|---------|-----|
| Runtime | Node 22 | Stable baseline for the ecosystem and team docs |
| Package manager | pnpm | Fast workspaces, predictable installs, strong monorepo fit |
| App framework | TanStack Start | Typed full-stack React with strong router/query story |
| Content framework | Astro | Better fit for content, SEO, and marketing surfaces |
| API layer | Hono + ORPC | Thin edge-friendly API surface with type safety |
| Database layer | Drizzle + D1 | Simple SQL model aligned with Cloudflare deployment |
| Auth | Better Auth | Good TypeScript ergonomics and D1-friendly setup |
| Styling | Tailwind v4 + shadcn/ui | Fast product work with a maintainable base component layer |
| Quality gates | VoidZero tooling + Ultracite + tsgo + Vitest/Playwright + React Doctor | Fast linting, formatting, testing, type safety, behavior, and React-specific security/best-practice checks |
| Deploy | Wrangler + Cloudflare + Alchemy | Default hosting target and IaC path for apps, APIs, and edge services |
| Secrets | Infisical + Cloudflare Worker secrets | Safe storage, local injection, CI fetch, and runtime bindings |
| Editor | Cursor or VS Code | Mature editor workflow with strong extension support |
| Terminal AI | Claude Code | Good fit for repo-wide changes, terminal tasks, and documentation work |

## Installed Does Not Mean Primary

This machine has more than one runtime and more than one coding surface installed. That is useful, but it can also create drift.

- `node` + `pnpm` should stay the documented default for this repo.
- `bun` and `deno` are valuable secondary tools, not the baseline for team commands.
- `python3` + `uv` and `rustc` + `cargo` are strong support toolchains, but they are not the center of the product stack.
- `Cursor`, `VS Code`, and `Claude Code` can coexist if each has a clear role.

For the machine-specific version snapshot, see [Local Toolchain Snapshot](./LOCAL-TOOLCHAIN.md).

## VoidZero Tooling Direction

VoidZero is the preferred direction for JavaScript tooling because it aligns with the stack's goals: fast feedback, one coherent toolchain, and fewer bespoke configs.

| Tool | Role in the stack | Adoption posture |
|------|-------------------|------------------|
| Vite | Dev server and framework foundation for TanStack Start and Astro | Default |
| Vitest | Unit and integration tests that understand Vite config | Default |
| Oxlint / Oxfmt | High-performance linting and formatting foundations | Default through Ultracite where possible |
| Rolldown / `rolldown-vite` | Faster bundling and future Vite build path | Try on larger apps or slow builds |
| `tsdown` | Library/package build tool | Default for internal packages that need published artifacts |
| Vite+ | Unified web toolchain entry point | Experimental for new prototypes until stable enough for client work |

Adoption should be staged:

1. **Stable default:** Vite, Vitest, Ultracite, tsgo, and Playwright.
2. **Performance upgrade:** try `rolldown-vite` when build time is a real bottleneck.
3. **Package build default:** use `tsdown` instead of custom Rollup/tsup configs for libraries.
4. **Experimental lane:** evaluate Vite+ on prototypes before standardizing it for production apps.

## Recommended Operating Mode

### Use one default path for delivery

- Document commands with `pnpm`.
- Assume Node 22 for local development and CI unless a project says otherwise.
- Build product apps with TanStack Start unless Astro is clearly the better fit.
- Keep backend work thin with Hono, ORPC, Drizzle, and Better Auth.
- Treat Cloudflare as the default deployment target, not an afterthought.

### Keep secondary tools optional

- Reach for `bun` when a specific tool benefits from it.
- Reach for `deno` when a script or runtime explicitly needs it.
- Use Python or Rust for support utilities, CLIs, or ecosystem-specific tasks.
- Avoid writing repo-level instructions that require every installed tool just because it exists on one machine.

## Why This Stack Works Well with AI

- Strict TypeScript gives AI sharper constraints and reduces ambiguous edits.
- Slice-based architecture keeps changes local instead of scattering them across layers.
- Cloudflare tooling is scriptable and works well with terminal-oriented agents.
- Infisical keeps agents from needing plaintext `.env` files while still enabling deploy/test commands.
- Good documentation narrows prompts and keeps AI output aligned with team standards.
- Tests, typechecks, and React Doctor provide the fast feedback loop AI needs to be trustworthy before pushing or merging.

## Improvement Priorities

1. Keep the stack opinionated: `pnpm`, Node 22, TanStack Start or Astro, Cloudflare by default.
2. Make the AI workflow explicit instead of relying on ad hoc prompting.
3. Add TDD earlier so AI-generated code is guided by executable behavior.
4. Track local toolchain drift so docs match reality.
5. Keep the root `README.md` lightweight and move operational detail into focused guides.

## Related Guides

- [AI Development Workflow](./AI-DEVELOPMENT-WORKFLOW.md)
- [TDD with AI](./TDD-WITH-AI.md)
- [Local Toolchain Snapshot](./LOCAL-TOOLCHAIN.md)
- [Development Strategy](./DEVELOPMENT-STRATEGY.md)
