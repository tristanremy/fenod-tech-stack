---
title: "Observabilite"
description: "Visibilite runtime par defaut pour les apps Cloudflare Workers."
verified: 2026-06
---

## Default Path

Chaque Worker deploye doit activer Cloudflare Workers Observability et configurer une notification de taux d'erreur dans le dashboard Cloudflare.

```jsonc
{
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  }
}
```

Utiliser `head_sampling_rate: 1` pour les petites apps client et les lancements production initiaux afin de voir les erreurs rares. Le baisser seulement quand le volume rend les traces completes trop bruyantes ou couteuses.

Creer l'alerte dans Cloudflare Dashboard:

```txt
Workers & Pages → your Worker → Observability / Logs → Notifications
```

L'alerte minimale est un taux d'erreur eleve ou des exceptions repetees envoyees par email.

## Tier 2: Sentry

Les apps produit et les apps avec utilisateurs payants ajoutent Sentry au-dessus de Workers Observability.

Installer le SDK Cloudflare:

```bash
pnpm add @sentry/cloudflare
```

Le SDK Cloudflare de Sentry necessite `AsyncLocalStorage`, donc ajouter un flag compatible:

```jsonc
{
  "compatibility_flags": ["nodejs_als"]
}
```

Stocker `SENTRY_DSN` dans Infisical et le synchroniser comme Worker secret. Ne pas mettre le DSN dans des `vars` publiques.

## Gotchas

- Le sampling peut cacher les erreurs rares. Utiliser le sampling complet jusqu'a preuve par le trafic.
- Une alerte sans canal de notification est decorative, pas de l'observabilite.
- `wrangler tail` aide au debug actif, mais ce n'est pas du monitoring persistant.

## Agent Notes

Tier 1 est obligatoire pour chaque Worker deploye: `observability.enabled = true` plus une alerte d'erreur. Tier 2 est Sentry pour les apps produit, les flux utilisateurs payants, ou toute app ou une panne silencieuse cree un risque client.

## Guides Lies

- [Debugging](/fr/debugging/)
- [Deployment](/fr/deployment/)
- [Environment and Secrets](/fr/environment-secrets/)
