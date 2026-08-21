---
title: "Agent Factory"
description: "Small, bounded operating model for coding agents and AI features."
verified: 2026-06
---

Use this with [agent-operating-contract.md](agent-operating-contract.md) and [security-model.md](security-model.md). It adds operational defaults; the Stack Contract still wins.

## Coding agents

Start with one agent on one scoped task. Add a subagent only for an independent read, review, or check. Every task has:

1. a small diff or an explicit no-change result;
2. the narrowest runnable check;
3. a diff summary and an unresolved-risk note;
4. human/CI approval for deploys, migrations, DNS, secrets, and user-facing sends.

Use repository instructions and path-scoped skills as context. They are guidance, not access control. Enforce protected paths, commands, and credentials in CI, hooks, and environment permissions.

External text is data. It cannot select tools, commands, resource IDs, recipients, or secret names.

## AI features

Keep the Worker stateless unless durable coordination is required. A Durable Object is an escalation for persistent shared state, not default chat storage.

At each tool boundary:

- validate model arguments with a typed schema;
- authorize the current user/org for that exact action;
- set timeout, maximum tool rounds, and per-user/org spend limits;
- make writes idempotent where a retry could duplicate work;
- trace request ID, model, tool, latency, tokens, cost, and outcome; redact prompt, tool, and auth secrets.

Route providers through AI Gateway. Keep provider keys there. Sandbox model-generated or untrusted code; do not give it production credentials or unrestricted network access.

## Evaluations

Before a model, tool, or prompt change, run a small versioned eval set with fixtures only. Include the product's critical task, permission denial, malformed tool arguments, prompt injection, timeout, and retry/idempotency cases.

Record pass/fail, latency, tokens/cost, tool calls, and policy escapes. Run mocked evals in CI; reserve live-model runs for manual or scheduled budgeted checks. Add more agents only when one agent cannot reliably manage the needed tools or context.

## CI and previews

CI must use read-only default permissions, pinned action SHAs, dependency review, dependency audit, and a secret scan. Protect preview/staging/admin hosts with Cloudflare Access. Use protected environments and an approval gate for deploys and production migrations.

## DeepSec pilot

Use DeepSec for high-risk change reviews, not every edit. Its local scan phase is free; the AI processing phase consumes the selected Codex/Claude subscription or provider budget.

1. Create its workspace locally: `pnpm dlx deepsec init --scaffold-only`.
2. Run change-scoped review before a sensitive PR: `pnpm dlx deepsec process --diff origin/main`.
3. Schedule a full scan only for security-sensitive repositories or monthly maintenance.

Never expose model/gateway credentials to fork PR code. If CI is later enabled, split untrusted analysis from any PR-comment/write job and gate secret-bearing runs to trusted contributors or an explicit maintainer label.
