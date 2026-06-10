---
title: "AI Development Workflow"
verified: 2026-06
---

[Disponible en francais](/ai-development-workflow/)

The goal is not to let AI "write the app". The goal is to compress feedback loops while keeping architecture, tests, and product decisions under control.

## Tool Roles

| Tool | Best use |
|------|----------|
| Cursor | Inline edits, local code navigation, fast UI iteration, small refactors |
| Claude Code | Repo-scale changes, terminal work, migrations, docs, and multi-file reasoning |
| VS Code | Fallback editor, extensions, and non-AI workflows |
| Docker + MCP Gateway | Dynamic tool loading without carrying every tool definition in context |
| Chrome DevTools MCP | Browser inspection, reproduction, DOM checks, and network debugging |
| Wrangler | Local Cloudflare workflows, bindings, logs, and deploy commands |

## Core Principles

1. Start from the user problem, not from a tool.
2. Ask AI to inspect before editing.
3. Constrain the diff to the smallest correct change.
4. Verify with tests, typechecks, and targeted manual checks.
5. Capture reusable patterns in docs so prompts get better over time.

## Default Workflow

### 1. Frame the task

Give AI the behavior, the constraint, and the acceptance criteria.

Good framing includes:

- the user-facing outcome
- the files or area to inspect first
- constraints such as "do not add dependencies" or "preserve current API"
- verification steps such as `pnpm test`, `pnpm typecheck`, or a manual browser path

### 2. Let AI inspect the existing system

Before making changes, have the agent read the current code, docs, and patterns. This lowers the chance of introducing a second architecture inside the same repository.

### 3. Make the smallest viable change

Prefer:

- patching one feature slice
- reusing existing helpers
- adding one focused test instead of a new framework layer
- documenting a rule rather than leaving it trapped in a prompt

### 4. Verify immediately

AI speed only helps if feedback is fast. Run the narrowest useful checks first, then broader checks when the change is stable.

- targeted unit or integration tests
- typecheck
- lint or format if the repo uses it
- manual UI path or browser inspection

### 5. Document what should repeat

If a pattern is likely to come back, move it into `docs/` instead of relying on memory or chat history.

## Prompt Patterns That Work Well

### Implementation prompt

```text
Task: add the smallest change that implements X.
Context: inspect the existing feature first and follow current patterns.
Constraints: do not add dependencies, keep the public API stable, avoid unrelated refactors.
Verify: run the relevant tests and typecheck.
Deliver: apply the change and explain any tradeoffs briefly.
```

### Refactor prompt

```text
Refactor this area for clarity without changing behavior.
Read the current tests first.
Keep the diff minimal and preserve external contracts.
Run the existing verification steps after the edit.
```

### Debug prompt

```text
Investigate this bug by reproducing it first.
Inspect logs, network, and browser state before changing code.
Explain the root cause, then implement the smallest fix and verify it.
```

## Where AI Adds the Most Value

- scaffolding and migration work
- slice-level implementation in a typed codebase
- writing or expanding tests from clear behavior
- refactors with existing constraints
- debugging with terminal tools and browser inspection
- converting repeated team knowledge into documentation

## Where Human Review Must Stay Strong

- auth and permission boundaries
- irreversible schema and data migrations
- pricing, analytics, and product tradeoffs
- dependency changes with security or bundle impact
- any change where the acceptance criteria are still unclear

## Definition of Done for AI-Assisted Changes

- the task was framed in terms of behavior
- existing patterns were inspected before editing
- the change stayed local and intentional
- tests or verification steps were run
- reusable knowledge was added to docs when appropriate

## Related Guides

- [MCP Guide](/mcp-guide/)
- [TDD with AI](/tdd-with-ai/)
- [Testing Guide](/testing/)
- [Debugging](/debugging/)
