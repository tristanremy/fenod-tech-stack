<p align="center">
  <a href="https://stack.fenod.fr">
    <img alt="Fenod" src="https://fenod.fr/favicon.svg" width="80">
  </a>
</p>

# Fenod Stack Handbook

This repository is the source for **[stack.fenod.fr](https://stack.fenod.fr)**, the public bilingual Starlight handbook for Fenod's default technology stack, operating practices, AI-agent rules, Cloudflare deployment patterns, and implementation recipes.

The website is the canonical reading surface. This README is only the repository landing page.

## Local Development

```bash
pnpm install
pnpm dev
```

Open:

```txt
http://localhost:4321
```

## Build

```bash
pnpm build
```

The build:

1. renders Mermaid sources from `src/diagrams/*.mmd` into `public/diagrams/*.svg`;
2. generates `public/llms.txt` and `public/llms-full.txt`;
3. runs `astro check`;
4. builds the static Starlight site into `dist/`.

## Deploy

The site is intended for Cloudflare Pages.

```txt
Build command: pnpm build
Output directory: dist
Production branch: main
Custom domain: stack.fenod.fr
```

## Repository Structure

```txt
src/content/docs/       Starlight handbook pages
src/content/docs/fr/    French handbook pages
src/diagrams/           Mermaid diagram sources
public/diagrams/        Generated SVG diagrams
scripts/                Build-time generators
docs/adr/               Lightweight architecture decision records
CONTEXT.md              Domain glossary for this handbook
```

## AI Entry Points

Agents should start with:

- [AI Index](https://stack.fenod.fr/ai-index/)
- [Stack Contract](https://stack.fenod.fr/stack-contract/)
- [Agent Operating Contract](https://stack.fenod.fr/agent-operating-contract/)
- [Gotchas](https://stack.fenod.fr/gotchas/)
- [Recipes](https://stack.fenod.fr/recipes/)

Machine-readable entry points:

- <https://stack.fenod.fr/llms.txt>
- <https://stack.fenod.fr/llms-full.txt>

## Publishing Gate

Before pushing to `main`:

```bash
pnpm build
```

Also check:

- no real secrets or private infrastructure details;
- public/internal boundary is respected;
- English source page and French page stay aligned;
- diagrams are regenerated when `.mmd` files change;
- `llms.txt` and `llms-full.txt` are regenerated;
- README stays a repository landing page, not a duplicate handbook.

## Decisions

Architecture decisions are recorded in [`docs/adr/`](docs/adr/):

- [0001: Use Starlight for the Fenod Stack Handbook](docs/adr/0001-use-starlight-for-stack-handbook.md)
- [0002: Use this public repo as the source for stack.fenod.fr](docs/adr/0002-public-repo-source-for-stack-site.md)
- [0003: Maintain dual human and agent documentation layers](docs/adr/0003-dual-human-and-agent-documentation-layers.md)
