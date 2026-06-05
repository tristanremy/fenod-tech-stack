# Tokens API Cloudflare pour le travail assisté par IA

[Available in English](../CLOUDFLARE-API-TOKENS.md)

Utilise ce guide pour créer des identifiants Cloudflare pour le développement local, la CI, les déploiements, les serveurs MCP ou les agents IA. Objectif : permettre aux agents d'être utiles sans leur donner un contrôle large du compte ni des secrets longue durée inutiles.

## Règles d'or

1. **Préférer OAuth pour Wrangler en local.** Ne pas exporter `CLOUDFLARE_API_TOKEN` globalement : cette variable remplace OAuth et cause souvent des erreurs de permissions confuses.
2. **Créer des tokens étroits et dédiés.** Un token par surface d'automatisation : déploiement CI, preview, migrations D1, upload R2, lecture analytics, etc.
3. **Ne jamais coller de token dans un prompt, une issue, une PR, des logs ou de la doc.** Utiliser Bitwarden Secrets Manager, Infisical, les secrets Cloudflare ou les secrets CI.
4. **Ne pas donner d'accès édition compte entier aux agents IA par défaut.** Passer par des scripts, des outils MCP contrôlés ou des jobs CI avec scopes limités.
5. **Révoquer vite après expérimentation.** Tout token utilisé pendant du travail exploratoire avec IA doit être court-terme ou supprimé après la session.

## Wrangler en local

Pour le développement humain quotidien :

```bash
wrangler login
```

Quand une machine peut avoir un token exporté, le retirer explicitement :

```bash
env -u CLOUDFLARE_API_TOKEN wrangler whoami
env -u CLOUDFLARE_API_TOKEN wrangler pages deploy dist --project-name my-project
env -u CLOUDFLARE_API_TOKEN wrangler d1 migrations apply my-db --local
```

Ne définir `CLOUDFLARE_API_TOKEN` que dans un processus étroit, un job CI ou une commande injectée par un gestionnaire de secrets.

## Profils de tokens

Créer des tokens séparés pour des tâches séparées. Format conseillé :

```text
fenod:<project>:<env>:<purpose>:<owner>
```

Exemples :

```text
fenod:client-app:prod:workers-deploy:github-actions
fenod:client-app:preview:pages-deploy:github-actions
fenod:client-app:prod:d1-migrations:ci
fenod:client-app:dev:r2-upload:agent-broker
```

## Carte des permissions minimales

| Tâche | Permissions typiques | Portée | Notes |
|------|----------------------|--------|-------|
| Déploiement Workers | Workers Scripts: Edit, Account Settings: Read si Wrangler l'exige | Un compte, idéalement un script/projet | Pour CI seulement ; éviter pour agents ad hoc. |
| Déploiement Pages | Cloudflare Pages: Edit | Un compte, projet Pages précis si possible | Préférer `wrangler pages deploy` depuis CI. |
| Migrations D1 | D1: Edit | Base précise si possible | Séparer des tokens de déploiement app. |
| Upload R2 | R2: Edit | Bucket précis si possible | Éviter l'admin R2 global. |
| Écritures KV | Workers KV Storage: Edit | Namespace précis si possible | KV peut contenir de la config sensible. |
| Queues | Queues: Edit | Queue précise si possible | Séparer bindings runtime et tokens admin. |
| Analytics / logs | Analytics: Read, Logs: Read si besoin | Lecture seule | Adapté aux agents de debug. |
| DNS | Zone DNS: Edit | Une zone seulement | Très risqué ; ne jamais mélanger avec déploiement. |
| Gestion compte/utilisateurs | Account Settings/User details: Read/Edit | Compte | À éviter pour agents sauf approbation explicite. |

Si un token a besoin de permissions sans rapport, le découper ou déplacer l'opération derrière une CI avec validation humaine.

## Pattern de sécurité pour agents IA

Hiérarchie recommandée :

1. **Contexte lecture seule :** docs, `wrangler.jsonc`, types générés, sortie de commandes assainie.
2. **Commandes OAuth locales :** Wrangler authentifié humainement avec `env -u CLOUDFLARE_API_TOKEN`.
3. **Scripts broker :** scripts versionnés comme `deploy-preview`, `apply-local-migrations`, `tail-logs`.
4. **CI :** déploiements prod et migrations via GitHub Actions avec secrets scopés.
5. **Break-glass :** token temporaire, limité, révoqué après la tâche.

Bonne commande exposée à un agent :

```bash
pnpm cf:deploy-preview
```

Commande risquée :

```bash
CLOUDFLARE_API_TOKEN=... wrangler deploy --env production
```

## Stockage des secrets

| Contexte | Stocker dans | Éviter |
|----------|--------------|--------|
| Machine locale | Bitwarden Secrets Manager ou Infisical | Exports shell globaux, `.env`, notes |
| Runtime local | Secrets Cloudflare ou injection par gestionnaire de secrets | `.dev.vars` commité avec vraies valeurs |
| CI/CD | GitHub Actions secrets/environments, Infisical, Bitwarden | Valeurs en clair dans YAML |
| Worker runtime | Secrets/bindings Cloudflare | Variables frontend bundlées |
| IA/MCP | Commandes broker ou tokens courts et étroits | Token compte général partagé |

## Checklist agent

- [ ] La commande utilise OAuth en local ou un secret CI scopé.
- [ ] `CLOUDFLARE_API_TOKEN` n'est pas exporté globalement.
- [ ] Le token ne peut pas modifier le DNS sauf tâche DNS explicite.
- [ ] Le token ne peut pas modifier D1/R2/KV hors projet cible.
- [ ] L'opération est scriptée et relisible.
- [ ] Les déploiements/migrations prod demandent une validation humaine.
- [ ] Tout token temporaire a un propriétaire et une date de suppression.

## Guides liés

- [Deployment Guide](../DEPLOYMENT.md)
- [Environment and Secrets](../ENVIRONMENT-SECRETS.md)
- [Cloudflare Compute](../CLOUDFLARE-COMPUTE.md)
- [MCP Guide](../MCP-GUIDE.md)
