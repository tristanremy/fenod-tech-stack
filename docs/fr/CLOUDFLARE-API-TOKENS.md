# Cloudflare API Tokens for AI-Assisted Work

[Available in English](../CLOUDFLARE-API-TOKENS.md)

Use this guide when creating Cloudflare credentials for local development, CI, deploys, MCP servers, or AI coding agents. The goal is simple: agents can do useful Cloudflare work without receiving broad account control or long-lived secrets they do not need.

## Golden Rules

1. **Prefer OAuth for local Wrangler commands.** Do not export `CLOUDFLARE_API_TOKEN` globally; it overrides Wrangler OAuth and often causes confusing permission failures.
2. **Use narrow, task-specific tokens.** Create one token per automation surface: CI deploy, preview deploy, D1 migrations, R2 upload, analytics read, etc.
3. **Use resource-scoped permissions whenever Cloudflare supports them.** A deploy token should target one Worker, one Pages project, one D1 database, one R2 bucket, or one zone instead of the whole account.
4. **Never paste tokens into prompts, issues, PRs, logs, or markdown docs.** Store secrets in Bitwarden Secrets Manager, Infisical, Cloudflare secrets, or CI secret storage.
5. **Do not give AI agents account-wide edit access by default.** Broker sensitive operations through scripts, MCP tools, or CI jobs with limited scopes.
6. **Rotate aggressively after experiments.** Any token used during exploratory AI work should be short-lived or deleted after the session.

## Local Wrangler Usage

For day-to-day human development, use Wrangler OAuth:

```bash
wrangler login
```

When running local commands on a machine that might have a token exported, explicitly unset it:

```bash
env -u CLOUDFLARE_API_TOKEN wrangler whoami
env -u CLOUDFLARE_API_TOKEN wrangler pages deploy dist --project-name my-project
env -u CLOUDFLARE_API_TOKEN wrangler d1 migrations apply my-db --local
```

Only set `CLOUDFLARE_API_TOKEN` inside a narrow process, CI job, or secret-injected command that truly needs API-token auth.

## Token Profiles

Create separate Cloudflare API tokens for separate jobs. Names should include the project, environment, purpose, and owner.

Recommended naming format:

```text
fenod:<project>:<env>:<purpose>:<owner>
```

Examples:

```text
fenod:client-app:prod:workers-deploy:github-actions
fenod:client-app:preview:pages-deploy:github-actions
fenod:client-app:prod:d1-migrations:ci
fenod:client-app:dev:r2-upload:agent-broker
```

## Least-Privilege Resource Map

Use Cloudflare's token templates as a starting point, then reduce account/resource access to the smallest possible scope. For old tokens, reissue them with the newest Cloudflare token format and resource-scoped policies so leaked tokens are easier to detect and the blast radius is smaller.

| Job | Typical permissions | Resource scope | Notes |
|-----|---------------------|----------------|-------|
| Workers deploy | Workers Scripts: Edit, Account Settings: Read if required by Wrangler | One account, ideally one script/project | Use for CI deploy only; avoid giving this to ad hoc agents. |
| Pages deploy | Cloudflare Pages: Edit | One account, specific Pages project if available | Prefer `wrangler pages deploy` from CI. |
| D1 migrations | D1: Edit | Specific account/database where possible | Keep separate from app deploy tokens. Migrations can destroy data. |
| R2 object upload | R2: Edit | Specific bucket where possible | For app assets/backups; avoid account-wide R2 admin. |
| KV writes | Workers KV Storage: Edit | Specific namespace where possible | KV often stores config; treat writes as sensitive. |
| Queues management | Queues: Edit | Specific queue where possible | Separate runtime producer/consumer bindings from admin tokens. |
| Analytics/read-only inspection | Analytics: Read, Logs: Read if needed | Account/project read-only | Safe for dashboards and debugging agents. |
| DNS automation | Zone DNS: Edit | One zone only | High risk: can hijack traffic. Never bundle with deploy tokens. |
| Account/user management | Account Settings/User details: Read/Edit | Account | Avoid for agents unless building admin automation with explicit approval. |

If a token needs many unrelated permissions, split it into multiple tokens or move the operation behind a human-approved CI workflow.

## Platform Tokens vs Provider Keys

Do not mix these two credential classes:

| Layer | Credential | Owns | Preferred boundary |
|-------|------------|------|--------------------|
| Cloudflare platform | `CLOUDFLARE_API_TOKEN` | Deploying Workers, editing DNS, creating D1/R2/KV/Queues | Resource-scoped token, CI/broker controlled |
| AI provider access | OpenAI/Anthropic/Gemini/Replicate keys | Model inference spend and data access | Cloudflare AI Gateway BYOK or provider secret store |
| Agent runtime budget | Model context/output tokens | Cost and context pressure while agents work | Code Mode, tool search, summaries, budget caps |

A Worker deploy token should not also be the way the app calls LLM providers. Likewise, an LLM provider key should not be available to an infrastructure-management agent unless the task explicitly requires it.

## AI Gateway BYOK for Provider Keys

For deployed AI apps, prefer Cloudflare AI Gateway with BYOK / stored provider keys over raw provider keys in Worker secrets.

Recommended production pattern:

1. Security/admin owner stores provider keys in Cloudflare AI Gateway or a secret manager integrated with it.
2. Application code references the stored key or gateway route, not the plaintext provider key.
3. Developers and agents can deploy code that references approved keys, but cannot read the key value.
4. AI Gateway enforces budgets, rate limits, caching, fallback, and audit logging.
5. Dynamic routes or gateway policies cap runaway loops before they become billing incidents.

Use direct Worker secrets for provider keys only when AI Gateway does not support the provider/workflow yet, or during short-lived local development. Document the exception and migrate it back behind Gateway when possible.

Provider caveat: some SDKs/providers still require direct API-key signing or are not fully OpenAI-compatible. Treat those as explicit exceptions with narrower secrets and tighter budgets.

## AI Agent Safety Pattern

AI agents should not directly hold broad Cloudflare tokens. Prefer this hierarchy:

1. **Read-only context:** docs, `wrangler.jsonc`, generated types, and sanitized command output.
2. **Local OAuth commands:** human-authenticated Wrangler with `env -u CLOUDFLARE_API_TOKEN`.
3. **Broker scripts:** checked-in scripts expose safe operations like `deploy-preview`, `apply-local-migrations`, or `tail-logs`.
4. **CI workflows:** production deploys and migrations run from GitHub Actions with scoped secrets.
5. **Break-glass token:** temporary, time-boxed, manually revoked after the task.

Good agent-facing command:

```bash
pnpm cf:deploy-preview
```

Risky agent-facing command:

```bash
CLOUDFLARE_API_TOKEN=... wrangler deploy --env production
```

## Repository Scripts to Prefer

Add project scripts so agents do not invent privileged commands:

```json
{
  "scripts": {
    "cf:whoami": "env -u CLOUDFLARE_API_TOKEN wrangler whoami",
    "cf:types": "env -u CLOUDFLARE_API_TOKEN wrangler types",
    "cf:d1:local": "env -u CLOUDFLARE_API_TOKEN wrangler d1 migrations apply DB --local",
    "cf:deploy:preview": "pnpm build && env -u CLOUDFLARE_API_TOKEN wrangler pages deploy dist --project-name PROJECT"
  }
}
```

For CI-only scripts, document that they require injected secrets and should not be run locally by agents.

## Secret Storage

| Context | Store tokens in | Avoid |
|---------|-----------------|-------|
| Local human machine | Bitwarden Secrets Manager or Infisical | Shell profile exports, `.env`, notes apps |
| Local app runtime | Cloudflare `wrangler secret put` or local secret manager injection | Committed `.dev.vars` with real values |
| CI/CD | GitHub Actions secrets/environments, Infisical, Bitwarden Secrets Manager | Plain workflow YAML values |
| Worker runtime | Cloudflare secrets/bindings | Bundled frontend env vars |
| AI/MCP tooling | Brokered commands or short-lived narrow tokens | Shared all-purpose account token |

Never commit real Cloudflare credentials. `.env.example` may list variable names only.

## Production Gates

For production-affecting operations, require at least one gate:

- protected GitHub environment approval
- manual `workflow_dispatch` approval
- branch protection + reviewed PR
- a broker service that validates allowed resource IDs
- Cloudflare token with only the target resource and permission

Production D1 migrations, DNS edits, Worker route changes, and account-level settings should never be silent side effects of an AI coding session.

## Incident Response

If a token may have leaked:

1. Revoke the token in Cloudflare immediately.
2. Search repo, PRs, logs, CI output, issue comments, and agent transcripts for the value or prefix.
3. Rotate any downstream credentials the token could access or overwrite.
4. Review Cloudflare audit logs for deploys, DNS edits, data writes, and new tokens.
5. Add a narrower replacement token only after the incident is understood.

## Agent Checklist

Before asking an AI agent to run Cloudflare commands, confirm:

- [ ] The command uses OAuth locally or a scoped CI secret.
- [ ] `CLOUDFLARE_API_TOKEN` is not globally exported.
- [ ] The token cannot edit DNS unless the task is explicitly DNS-related.
- [ ] The token cannot edit D1/R2/KV resources outside the target project.
- [ ] The operation is scripted and reviewable.
- [ ] Production deploys/migrations require human approval.
- [ ] Any temporary token has an owner and deletion date.

## Related Guides

- [Deployment Guide](./DEPLOYMENT.md)
- [Environment and Secrets](./ENVIRONMENT-SECRETS.md)
- [Cloudflare Compute](./CLOUDFLARE-COMPUTE.md)
- [MCP Guide](./MCP-GUIDE.md)
