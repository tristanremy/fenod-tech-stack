---
title: "Vue d'ensemble de la stack"
verified: 2026-06
---

[Disponible en anglais](/fr/stack-overview/)

This is the operating view of the Fenod stack: what should be primary, what is optional, and how the local machine setup maps to jour-to-jour delivery.

## Ce que cette stack optimise

- Développement produit type-safe avec un minimum de cérémonie
- Itération rapide pour les petites équipes qui livrent à l’edge
- Patterns réutilisables entre apps, sites de contenu, outils internes et fonctionnalités IA
- Développement assisté par IA avec contraintes fortes plutôt que génération de code libre
- Un chemin par défaut assez simple à enseigner et assez rapide pour livrer

## Choix par défaut

![TanStack Start architecture](/diagrams/tanstack-start-architecture-fr.svg)

| Couche | Défaut | Pourquoi |
|-------|---------|-----|
| Runtime | Node 22 | Base stable pour l’écosystème et la documentation d’équipe |
| Package manager | pnpm | Workspaces rapides, installations prévisibles, excellent choix monorepo |
| App framework | TanStack Start | React full-stack typé avec un solide modèle router/query |
| Content framework | Astro | Meilleur choix pour le contenu, le SEO et les surfaces marketing |
| API layer | Hono + ORPC | Surface API fine, compatible edge et type-safe |
| Database layer | Drizzle + D1 | Modèle SQL simple aligné sur le déploiement Cloudflare |
| Auth | Better Auth | Good TypeScript ergonomics and D1-friendly setup |
| Styling | Tailwind v4 + shadcn/ui | Fast product work with a maintainable base component layer |
| Quality gates | VoidZero tooling + Ultracite + tsgo + Vitest/Playwright + React Doctor | Fast linting, formatting, testing, type safety, behavior, and React-specific security/best-practice checks |
| Deploy | Wrangler + Cloudflare + Alchemy | Default hosting target and IaC path for apps, APIs, and edge services |
| Secrets | Infisical + Cloudflare Worker secrets | Safe storage, local injection, CI fetch, and runtime bindings |
| Editor | Cursor or VS Code | Mature editor workflow with strong extension support |
| Terminal AI | Claude Code | Good fit for repo-wide changes, terminal tasks, and documentation work |

## Installé ne veut pas dire principal

This machine has more than one runtime and more than one coding surface installed. That is useful, but it can also create drift.

- `node` + `pnpm` should stay the documented default for this repo.
- `bun` and `deno` are valuable secondary tools, not the baseline for team commands.
- `python3` + `uv` and `rustc` + `cargo` are strong support toolchains, but they are not the center of the product stack.
- `Cursor`, `VS Code`, and `Claude Code` can coexist if each has a clear role.

For the machine-specific version snapshot, see [État de l'outillage local](/fr/local-toolchain/).

## Direction outillage VoidZero

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

## Mode de fonctionnement recommandé

### Utilisez one default path for delivery

- Document commands with `pnpm`.
- Assume Node 22 for local development and CI unless a project says otherwise.
- Build product apps with TanStack Start unless Astro is clearly the better fit.
- Keep backend work thin with Hono, ORPC, Drizzle, and Better Auth.
- Treat Cloudflare as the default deployment target, not an afterthought.

### Keep secondary tools optional

- Reach for `bun` when a specific tool benefits from it.
- Reach for `deno` when a script or runtime explicitly needs it.
- Utilisez Python or Rust for support utilities, CLIs, or ecosystem-specific tasks.
- Avoid writing repo-level instructions that require every installed tool just because it exists on one machine.

## Pourquoi cette stack fonctionne bien avec l'IA

- Strict TypeScript gives AI sharper constraints and reduces ambiguous edits.
- Slice-based architecture keeps changes local instead of scattering them across layers.
- Cloudflare tooling is scriptable and works well with terminal-oriented agents.
- Infisical keeps agents from needing plaintext `.env` files while still enabling deploy/test commands.
- Good documentation narrows prompts and keeps AI output aligned with team standards.
- Tests, typechecks, and React Doctor provide the fast feedback loop AI needs to be trustworthy before pushing or merging.

## Priorités d'amélioration

1. Keep the stack opinionated: `pnpm`, Node 22, TanStack Start or Astro, Cloudflare by default.
2. Make the AI workflow explicit instead of relying on ad hoc prompting.
3. Add TDD earlier so AI-generated code is guided by executable behavior.
4. Track local toolchain drift so docs match reality.
5. Keep the root `README.md` lightweight and move operational detail into focused guides.

## Guides liés

- [AI Development Workflow](/fr/ai-development-workflow/)
- [TDD with AI](/fr/tdd-with-ai/)
- [État de l'outillage local](/fr/local-toolchain/)
- [Development Strategy](/fr/development-strategy/)
