---
title: "Decisions"
description: "Architecture decisions behind the Fenod Stack Handbook."
verified: 2026-06
---

This page summarizes the lightweight ADRs that explain hard-to-reverse handbook decisions. Full ADR files live in the public repository under `docs/adr/`.

## Accepted Decisions

| ADR | Decision | Why it matters |
|-----|----------|----------------|
| 0001 | Use Starlight for the Fenod Stack Handbook | Starlight is Markdown-first, bilingual, searchable, Cloudflare-friendly, and easy for agents to edit through normal diffs. |
| 0002 | Use this public repo as the source for `stack.fenod.fr` | The public repo makes the handbook transparent and AI-readable, but requires private operating notes to live elsewhere. |
| 0003 | Maintain dual human and agent documentation layers | Humans need rationale and examples; agents need concise contracts, defaults, gotchas, and verification commands. |

## Decision Standard

Create ADRs sparingly. A decision deserves an ADR only when it is hard to reverse, surprising without context, and the result of a real trade-off.

## Related

- [Stack Contract](/stack-contract/)
- [Agent Operating Contract](/agent-operating-contract/)
- [Security Model](/security-model/)
