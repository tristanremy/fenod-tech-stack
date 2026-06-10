---
title: "Local Toolchain Snapshot"
verified: 2026-06
---

[Disponible en francais](/local-toolchain/)

Snapshot captured on `2026-03-30` for the machine currently maintaining this repository. Treat it as a working baseline, not a universal requirement.

## Core JavaScript Tooling

| Tool | Version | Role |
|------|---------|------|
| `node` | `v22.22.2` | Default JavaScript runtime |
| `npm` | `10.9.7` | Bundled package manager and fallback CLI |
| `pnpm` | `10.33.0` | Recommended package manager for repo commands |
| `bun` | `1.3.11` | Secondary runtime and utility CLI |
| `deno` | `2.7.9` | Secondary runtime for specific scripts or tooling |

## Editors and AI Tooling

| Tool | Version | Role |
|------|---------|------|
| `code` | `1.113.0` | VS Code fallback and extension ecosystem |
| `cursor` | `2.6.21` | Primary editor-side AI coding surface |
| `claude` | `2.1.85` | Terminal AI for repo-wide changes and workflows |

## Source Control and Platform Tooling

| Tool | Version | Role |
|------|---------|------|
| `git` | `2.50.1` | Source control |
| `gh` | `2.89.0` | GitHub CLI |
| `docker` | `29.3.1` | Containers, MCP gateway, and local service tooling |
| `wrangler` | `4.77.0` | Cloudflare development and deployment |
| `brew` | `5.1.1` | System package manager |

## Supporting Toolchains

| Tool | Version | Role |
|------|---------|------|
| `python3` | `3.12.13` | Utility scripts and Python ecosystem support |
| `uv` | `0.11.2` | Fast Python package and environment management |
| `rustc` | `1.94.1` | Native tooling support |
| `cargo` | `1.94.1` | Rust package manager and build tool |

## Not Currently Installed

| Tool | Status | Notes |
|------|--------|-------|
| `cloudflared` | not installed | Useful for tunnels and some preview workflows |
| `pipx` | not installed | Helpful if Python CLI usage grows |
| `go` | not installed | Only needed when a specific tool depends on it |
| `gemini` | not installed | Optional second AI CLI |
| `aider` | not installed | Optional terminal AI workflow |
| `opencode` | not installed | Optional alternative AI coding CLI |

## What This Setup Is Already Good At

- modern TypeScript application development
- Cloudflare-first deployment workflows
- AI-assisted editing with Cursor and Claude Code
- using Python or Rust tooling when a supporting script needs it

## What Should Stay Primary

- `node` + `pnpm` for repo-level commands and examples
- `wrangler` + `docker` for platform and local infrastructure workflows
- `cursor` or `code` in the editor, with `claude` for terminal-oriented work

`bun` and `deno` are useful to have installed, but the repo should not require them by default unless the stack direction changes.

## Possible Additions

1. Install `cloudflared` if preview tunnels, callbacks, or browser/device sharing become common.
2. Install `pipx` if Python-based CLIs become a regular part of the workflow.
3. Add a second AI CLI only if you want model diversity for comparison, not just more tools.
4. Add `go` only when a concrete dependency or internal tool actually needs it.

## Related Guides

- [Stack Overview](/stack-overview/)
- [AI Development Workflow](/ai-development-workflow/)
- [MCP Guide](/mcp-guide/)
