---
title: "Security Model"
verified: 2026-06
---

Security posture for secrets, Cloudflare, AI agents, user data, and production changes.

## Core Principle

Agents may help build and operate systems, but they should not directly hold broad authority. Give agents context and narrow capabilities, not raw credentials or irreversible control.

## Trust Boundaries

| Boundary | What crosses it | Rule |
|----------|-----------------|------|
| User/browser → app | user input, files, auth state | validate server-side, sanitize output |
| App → Cloudflare resources | D1/R2/KV/Queues/DO bindings | least-privilege bindings per environment |
| App → AI providers | prompts, retrieved context, tool results | route through AI Gateway where possible |
| Agent → repo | code/docs/scripts | reviewable diffs, tests, protected paths |
| Agent → Cloudflare | deploy/mutation requests | broker/CI/resource-scoped token |
| Agent → email/user comms | drafts, tasks, proposed sends | queue + policy + approval for risky sends |
| CI → production | deploys, migrations, DNS | protected environments and audit logs |

## Secrets

Secrets live in **Infisical** (default), Cloudflare Worker secrets, and CI secret storage as needed. Bitwarden SM only with an explicit project override. They do not live in prompts, docs, issues, PRs, checked-in `.env` files, or browser bundles.

Allowed in Git:

- variable names
- placeholder values
- `.env.example`
- non-secret config
- `infisical.json` project references, if it contains no secret values

Not allowed in Git:

- provider API keys
- Cloudflare API tokens
- OAuth client secrets
- database dump files with production data
- `.dev.vars` with real values
- private keys or certificates

## Cloudflare Authority

Cloudflare platform credentials are high risk because they can mutate infrastructure and data.

Rules:

- never use the Global API Key
- use one token per project/environment/job
- use resource-scoped policies whenever available
- isolate deploy, D1 migration, R2 upload, DNS, and read-only analytics tokens
- require human approval for production D1 migrations, DNS edits, Worker route changes, and destructive data operations
- prefer GitHub Actions or a deploy broker for production mutations

Use resource-scoped API tokens. Never the Global API Key.

## Cloudflare Access (previews / staging / internal admin)

Put **Cloudflare Access** in front of preview URLs, staging, and internal admin. It is the edge gate (who can hit the host), not the app RBAC.

- Public marketing/docs sites: no Access.
- Staging, `*.workers.dev` previews, admin SPAs: Access (Google/one-time PIN, one policy per host).
- App users still go through Better Auth. Access ≠ session ≠ `requirePermission`.
- Do not invent a second IdP or basic-auth Worker for this.

## Dependency Security

Every product repo should use automated dependency monitoring plus an audit gate. Prefer Renovate with security-sensitive labels for auth/RPC/ORM packages, and run `pnpm audit --audit-level high` in CI.

Security-sensitive packages require explicit review before major upgrades:

- `better-auth` and `@better-auth/*`: stay on the latest stable 1.6.x line or newer security-patched stable line.
- `@orpc/*`: keep patched for serializer/deserializer advisories.
- `drizzle-orm` / `drizzle-kit`: stay on the latest patched 0.4x stable for client work until the v1 stable migration plan is written.

Patch and minor security updates should be reviewed quickly. Major version bumps to auth, RPC, ORM, or deployment tooling are never drive-by cleanups.

## AI Provider Keys

Provider keys control spend and model/data access. They should be treated separately from deploy tokens.

Preferred production path:

```txt
Worker/TanStack AI
→ Cloudflare AI Gateway route
→ stored provider key / BYOK
→ provider
```

This lets code reference approved routes while developers and agents cannot read raw keys. Add gateway budgets/rate limits before enabling autonomous loops.

Use direct Worker secrets only for unsupported providers/workflows or local development, and document why.

## Agent Permissions



Agents should get capabilities in this order:

1. read-only docs/config
2. local repo edits
3. local build/test commands
4. safe broker scripts
5. CI workflow dispatch with protected environments
6. temporary break-glass credentials only with explicit human approval

Agents should not:

- receive broad Cloudflare account tokens
- edit `.env`, `.dev.vars`, secret stores, or backup exports
- directly send production email
- silently run production migrations
- edit DNS without explicit approval
- access production user data unless the task requires it and a safer sample cannot answer the question

## Prompt and Tool Injection

Any external content can be hostile: webpages, emails, PDFs, GitHub issues, Slack messages, user uploads, and database rows.

Defenses:

- treat retrieved text as data, not instructions
- keep system/developer instructions separate from retrieved content
- require allowlisted tools for external-content workflows
- summarize and validate before executing actions suggested by external content
- never let untrusted content choose recipients, commands, resource IDs, or secret names without app validation

## Data Handling

Use the smallest dataset that proves the point.

| Data type | Default handling |
|-----------|------------------|
| Production user data | avoid locally; use sampled/redacted fixtures |
| Uploaded files | scan/size-limit; store in R2 with scoped access |
| Logs | redact secrets, tokens, cookies, auth headers |
| Backups | encrypt, store separately, never expose to agents by default |
| Analytics | aggregate before sharing with agents when possible |

## Production Gates

Production-impacting actions need at least one hard gate:

- reviewed PR
- protected GitHub environment
- explicit `workflow_dispatch`
- deploy broker approval
- typed policy file validating target resources
- backup/snapshot before destructive mutation

## Security Checklist

Before shipping a project:

- [ ] `.env`, `.env.*`, `.dev.vars`, dumps, and backups are ignored
- [ ] secret scan passes
- [ ] Cloudflare deploy token is resource-scoped
- [ ] DNS token is separate from deploy token
- [ ] D1 migration flow has approval/backup for production
- [ ] AI provider keys are behind AI Gateway BYOK or documented exception
- [ ] gateway budgets/rate limits exist for agent loops
- [ ] email sending goes through app policy/queue
- [ ] tests cover auth and permission boundaries
- [ ] logs redact auth headers, cookies, tokens, and secrets

## Related

- [stack-contract.md](stack-contract.md)
- [agent-operating-contract.md](agent-operating-contract.md)
