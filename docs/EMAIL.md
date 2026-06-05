# Email

[Disponible en francais](./fr/EMAIL.md)

Use email primitives according to direction: inbound routing, transactional delivery, or lifecycle marketing. Do not make one tool do all three jobs.

## Default Decision

| Need | Default | Why |
|------|---------|-----|
| Inbound aliases and routing | Cloudflare Email Routing | Cheap, domain-native, simple forwarding |
| Inbound email workflows | Cloudflare Email Workers | Parse, validate, and broker email into app systems |
| Transactional outbound | Resend or Postmark | Better deliverability, templates, webhooks, and support |
| Lifecycle/marketing | Loops, Customer.io, or similar | Segments, campaigns, journeys, unsubscribe handling |
| Agent-triggered email | App/broker queue + approval policy | Prevents agents from directly sending arbitrary email |

## Cloudflare Email Routing

Use for:

- contact aliases like `hello@domain.com`
- forwarding role accounts to a human inbox
- lightweight support intake
- routing inbound messages to an Email Worker

Avoid for:

- product transactional mail
- newsletters
- marketing automations
- inbox/collaboration workflows

## Email Workers Pattern

Email Workers are the right primitive when inbound mail should become structured app data.

```txt
Inbound email
→ Cloudflare Email Worker
→ validate sender/domain/size/attachments
→ optionally store raw `.eml` in R2
→ write normalized event to Queue/D1
→ app or agent processes structured task
```

Recommended safeguards:

- reject unexpected senders or domains early
- cap message size and attachment count
- store raw email in R2 only when needed for audit/debugging
- strip or sandbox HTML before display
- normalize email into a typed event before agents see it
- never expose mailbox credentials to agents

## Transactional Outbound

Use Resend or Postmark for:

- verification emails
- magic links
- password reset
- invoices/receipts
- app notifications
- important user-facing delivery where bounces/webhooks matter

Keep provider keys server-only. Prefer Cloudflare AI Gateway BYOK for model keys, but email providers usually still require ordinary server secrets. Store them in Infisical/Bitwarden and sync only the needed runtime secret to the Worker.

```env
RESEND_API_KEY=
EMAIL_FROM=noreply@example.com
```

## Agent-Safe Outbound

Agents should not call email providers directly. Put email behind application policy.

```txt
Agent proposes email
→ app validates recipient/template/purpose
→ optional human approval for external or high-risk recipients
→ Queue job
→ server-side sender uses Resend/Postmark
→ delivery result written to audit log
```

Recommended policy gates:

| Email type | Gate |
|------------|------|
| internal test email | auto-allow in dev/staging |
| transactional email to current user | allow if template and recipient are fixed by app state |
| support reply draft | human approval before send |
| marketing/bulk email | marketing tool workflow, never raw agent send |
| unknown external recipient | human approval |

## Deliverability Defaults

For any domain that sends outbound mail:

- configure SPF
- configure DKIM
- configure DMARC, initially `p=none`, then tighten later
- use a dedicated sending subdomain when useful, e.g. `mail.example.com`
- monitor bounces and complaints
- keep unsubscribe handling for any non-transactional email

## Cloudflare vs Email Provider

Cloudflare should own inbound routing and edge workflows. Resend/Postmark should own outbound deliverability. Marketing tools should own campaigns and audiences. The app coordinates between them.

## Related Guides

- [Environment and Secrets](./ENVIRONMENT-SECRETS.md)
- [Cloudflare API Tokens](./CLOUDFLARE-API-TOKENS.md)
- [Security Model](./SECURITY-MODEL.md)
