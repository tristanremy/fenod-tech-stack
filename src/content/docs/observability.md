---
title: "Observability"
description: "Default runtime visibility for Cloudflare Workers apps."
verified: 2026-06
---

## Default Path

Every deployed Worker ships with Cloudflare Workers Observability enabled and an error-rate notification configured in the Cloudflare dashboard.

```jsonc
{
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  }
}
```

Use `head_sampling_rate: 1` for small client apps and early production launches so rare errors are visible. Lower it only when traffic volume makes full traces too noisy or expensive.

Create the alert in Cloudflare Dashboard:

```txt
Workers & Pages → your Worker → Observability / Logs → Notifications
```

The minimum alert is an elevated error rate or repeated exceptions routed to email.

## Tier 2: Sentry

Product apps and apps with paying users add Sentry on top of Workers Observability.

Install the Cloudflare SDK:

```bash
pnpm add @sentry/cloudflare
```

Sentry's Cloudflare SDK requires `AsyncLocalStorage`, so add one compatible flag:

```jsonc
{
  "compatibility_flags": ["nodejs_als"]
}
```

Store `SENTRY_DSN` in Infisical and sync it as a Worker secret. Do not put the DSN in public `vars`.

## Gotchas

- Sampling can hide rare errors. Use full sampling until traffic proves otherwise.
- Alerts without a notification channel are decorative, not observability.
- `wrangler tail` is useful for active debugging, but it is not persistent monitoring.

## Agent Notes

Tier 1 is mandatory for every deployed Worker: `observability.enabled = true` plus an error alert. Tier 2 is Sentry for product apps, paid-user flows, or any app where silent failures would create client risk.

## Related Guides

- [Debugging](/debugging/)
- [Deployment](/deployment/)
- [Environment and Secrets](/environment-secrets/)
