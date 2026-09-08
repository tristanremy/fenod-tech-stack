# Astro reference

Two static pages prove the [Astro recipe](../../docs/astro.md). This is a private, standalone package, not a root workspace or published library. No client code, CMS, database, auth, services or deployment credentials are needed.

## Run

Use Node 24 and pnpm 10.24.0:

```bash
pnpm install --frozen-lockfile
pnpm ship
# Optional globally installed portless (pnpm add -g portless):
portless --script preview
```

`portless.json` names the site `fenod-astro-reference`: normally **https://fenod-astro-reference.localhost**. Managed worktrees can receive a worktree-prefixed name; use the exact URL printed by portless. `portless` alone runs the dev script. Use the built preview for browser-JS checks; dev tooling is not production output.

`pnpm test` builds production `dist` and noindex `dist-preview`, then tests their HTML. `pnpm test:html` checks existing artifacts only. To inspect the noindex artifact locally:

```bash
portless run pnpm exec astro preview --outDir dist-preview --host 127.0.0.1
```

Build mode, not the hostname of a static server, controls indexability. Never reuse `dist` as a protected preview. Set the real public origin in `src/lib/site.ts` when adapting the example. `.example` is deliberately not a live business domain. Deploying or protecting a Worker requires a separate approved project flow; this package has no deploy script.

## Small ownership map

- `src/components/Head.astro`: sole metadata owner; ordinary Astro title escaping.
- `src/components/JsonLd.astro` and `src/lib/json-ld.ts`: typed data rendered with JSON-preserving Unicode escapes.
- `src/layouts/Page.astro`: page-specific WebPage data and accessible HTML shell.
- `src/pages/`: home lead image (`priority`) and content image (native lazy loading).
- `src/lib/pages.ts`: visible hostile-string fixtures shared with generated-HTML tests.
- `src/assets/landscape.png`: original 1200 × 630 geometric test artwork created for this reference; no external asset/license dependency. Astro creates WebP variants at build time; the original PNG is also the OG fixture, not a generated social card.
- `tests/generated-html.test.ts`: parses both modes, verifies tags, string round trips, local image outputs, no browser JS, and deliberately broken negative controls.

## Tooling boundaries

Astro **7.3.1**, `@astrojs/check` **0.9.10**, and the lockfile were resolved from the package registry, not inferred from client manifests. Astro owns its Vite dependency; do not override it to match another example.

`pnpm typecheck` runs **`astro check`**, including `.astro` templates and TypeScript. This package keeps **TypeScript 6.0.3** as the compiler-API compatibility dependency required by the Astro/Volar checker. TypeScript 7's CLI alone does not check Astro templates. This is the contract's tooling exception, not a compiler migration elsewhere.

Oxlint checks supported JS/TS source. Oxfmt checks supported files (including CSS, JSON and Markdown); `.oxfmtignore` excludes build output and unsupported `.astro` templates. Templates follow the existing two-space HTML style and get Astro diagnostics plus generated-output tests. No Prettier/ESLint configuration or formatter is added; the Astro language server has its own transitive tooling dependencies.

`pnpm ship` is read-only for source: format **check**, lint, template diagnostics **before** build, then generated-HTML tests. Build artifacts and caches are ignored. For repeatability, compare sorted SHA-256 hashes of all files in `dist` and `dist-preview` across two `pnpm test` runs in the same installed environment. Browser smoke/desktop/mobile review complements these tests; they do not measure real-user CWV or live headers.

The dedicated `astro` job in `.github/workflows/ci.yml` installs this lockfile, runs `pnpm ship`, and audits dependencies. It does not deploy.
