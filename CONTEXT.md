# Context Glossary

## Fenod Stack Handbook

The public, bilingual Starlight documentation site for Fenod's default technology stack, operating practices, AI-agent rules, Cloudflare deployment patterns, and implementation recipes.

## fenod-tech-stack

The source repository for the Fenod Stack Handbook.

## stack.fenod.fr

The public reading surface for the Fenod Stack Handbook.

## Fenod Builder

A human or AI agent building, maintaining, or reviewing a Fenod project using the stack defaults. The primary reader of the Fenod Stack Handbook.

## External Developer

A secondary reader evaluating Fenod's stack choices.

## Prospective Client

A secondary reader checking Fenod's technical seriousness without needing implementation detail.

## Agent Contract

A concise, structured documentation page that tells AI agents exactly which defaults to use, which actions are forbidden, which gotchas matter, and which verification commands prove completion. Human pages explain why; Agent Contracts define what to do.

## Public Stack Knowledge

Stack guidance, recipes, decision rationale, or gotchas that can be safely shared with clients, external developers, and AI agents without exposing private infrastructure, credentials, customer data, internal approval groups, or unreleased business plans.

## Default Path

The recommended implementation route for a Fenod Builder when no project-specific constraint overrides it. Every major guide should state the Default Path first, then list exceptions under "Use something else when...".

## Guide Shape

The standard section pattern for major Fenod Stack Handbook pages. Major stack guides should include a Default Path, Gotchas, Agent Notes, and Related Guides, with additional sections such as Use When, Avoid When, Implementation Recipe, Why It Matters, or Tradeoffs as appropriate.

## Implementation Recipe

A short, task-oriented path that gives a Fenod Builder the exact default tools, file locations, commands, gotchas, and verification steps for one common job.

## Source Locale

The language version that defines the canonical meaning of a page. For the Fenod Stack Handbook, English is the Source Locale unless a page explicitly says otherwise. French pages should preserve the same structure, slugs, diagrams, code blocks, and technical identifiers while translating prose for readability.

## Decision Diagram

A Mermaid-generated SVG that clarifies a boundary, flow, lifecycle, or decision path that would be harder to understand as prose. Decision Diagrams are used for architecture, workflows, trust boundaries, decision maps, and lifecycle loops; not for simple lists. Each Decision Diagram has Mermaid source, generated SVG output, alt text, and nearby prose explanation.

## Repository Landing Page

A root README that explains what the repo is, where the public docs live, how to run/build/deploy the site, and how to contribute. It should not duplicate the full Fenod Stack Handbook.

## Publishing Gate

The minimum verification required before changes to the Fenod Stack Handbook are pushed to `main`. The initial Publishing Gate is `pnpm build` plus a checklist for secrets, public/internal boundaries, Source Locale updates, French translation drift, regenerated diagrams, generated `llms.txt`/`llms-full.txt`, and README non-duplication.
