---
title: "Cloudflare API Tokens for AI-Assisted Work"
verified: 2026-06
---

[Disponible en anglais](/fr/cloudflare-api-tokens/)

Utilisez ce guide lors de la création d’identifiants Cloudflare pour le développement local, la CI, les déploiements, les serveurs MCP ou les agents de code IA. L’objectif est simple : les agents peuvent effectuer du travail Cloudflare utile sans recevoir un contrôle large du compte ni des secrets longue durée inutiles.

## Règles d’or

1. **Préférer OAuth pour les commandes Wrangler locales.** N’exportez pas `CLOUDFLARE_API_TOKEN` globalement ; il écrase l’OAuth Wrangler et provoque souvent des échecs de permissions confus.
2. **Utiliser des tokens étroits et spécifiques à la tâche.** Créez un token par surface d’automatisation : déploiement CI, déploiement preview, migrations D1, upload R2, lecture analytics, etc.
3. **Utiliser des permissions limitées aux ressources dès que Cloudflare les prend en charge.** Un token de déploiement doit cibler un Worker, un projet Pages, une base D1, un bucket R2 ou une zone plutôt que tout le compte.
4. **Ne jamais coller de tokens dans les prompts, issues, PRs, logs ou docs markdown.** Stockez les secrets dans Bitwarden Secrets Manager, Infisical, les secrets Cloudflare ou le stockage de secrets CI.
5. **Ne pas donner par défaut aux agents IA un accès edit sur tout le compte.** Brokerez les opérations sensibles via scripts, outils MCP ou jobs CI à scopes limités.
6. **Faire tourner agressivement après les expériences.** Tout token utilisé pendant du travail exploratoire avec IA doit être court-vécu ou supprimé après la session.

## Usage local de Wrangler

Pour le développement humain quotidien, utilisez Wrangler OAuth :

```bash
wrangler login
```

Quand vous lancez des commandes locales sur une machine qui peut avoir un token exporté, désactivez-le explicitement :

```bash
env -u CLOUDFLARE_API_TOKEN wrangler whoami
env -u CLOUDFLARE_API_TOKEN wrangler pages deploy dist --project-name my-project
env -u CLOUDFLARE_API_TOKEN wrangler d1 migrations apply my-db --local
```

Définissez `CLOUDFLARE_API_TOKEN` uniquement dans un processus étroit, un job CI ou une commande injectée par secret qui a vraiment besoin d’une authentification par token API.

## Profils de tokens

Créez des tokens API Cloudflare séparés pour des jobs séparés. Les noms doivent inclure le projet, l’environnement, le but et le propriétaire.

Format de nom recommandé :

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

## Carte moindre privilège des ressources

Utilisez les templates de tokens Cloudflare comme point de départ, puis réduisez l’accès compte/ressource au plus petit scope possible. Pour les anciens tokens, réémettez-les avec le format Cloudflare le plus récent et des politiques limitées aux ressources afin que les fuites soient plus faciles à détecter et que le rayon d’explosion soit plus petit.

| Job | Permissions typiques | Scope ressource | Notes |
|-----|---------------------|----------------|-------|
| Déploiement Workers | Workers Scripts: Edit, Account Settings: Read si requis par Wrangler | Un compte, idéalement un script/projet | À utiliser uniquement pour le déploiement CI ; éviter de le donner à des agents ad hoc. |
| Déploiement Pages | Cloudflare Pages: Edit | Un compte, projet Pages spécifique si disponible | Préférer `wrangler pages deploy` depuis la CI. |
| Migrations D1 | D1: Edit | Compte/base spécifique quand possible | Garder séparé des tokens de déploiement app. Les migrations peuvent détruire des données. |
| Upload objet R2 | R2: Edit | Bucket spécifique quand possible | Pour assets/backups app ; éviter l’admin R2 compte-wide. |
| Écritures KV | Workers KV Storage: Edit | Namespace spécifique quand possible | KV stocke souvent de la config ; traiter les écritures comme sensibles. |
| Gestion Queues | Queues: Edit | Queue spécifique quand possible | Séparer les bindings runtime producer/consumer des tokens admin. |
| Inspection analytics/read-only | Analytics: Read, Logs: Read si nécessaire | Lecture seule compte/projet | Sûr pour dashboards et agents de débogage. |
| Automatisation DNS | Zone DNS: Edit | Une seule zone | Haut risque : peut détourner le trafic. Ne jamais grouper avec les tokens de déploiement. |
| Gestion compte/utilisateur | Account Settings/User details: Read/Edit | Compte | À éviter pour les agents sauf automatisation admin avec approbation explicite. |

Si un token nécessite beaucoup de permissions sans lien, divisez-le en plusieurs tokens ou placez l’opération derrière un workflow CI approuvé par un humain.

## Tokens plateforme vs clés fournisseur

Ne mélangez pas ces classes d’identifiants :

![Couches de tokens Cloudflare](/diagrams/cloudflare-token-layers-fr.svg)

| Couche | Identifiant | Possède | Frontière préférée |
|-------|------------|------|--------------------|
| Plateforme Cloudflare | `CLOUDFLARE_API_TOKEN` | Déploiement Workers, édition DNS, création D1/R2/KV/Queues | Token limité aux ressources, contrôlé par CI/broker |
| Accès fournisseur IA | clés OpenAI/Anthropic/Gemini/Replicate | Dépense d’inférence modèle et accès données | Cloudflare AI Gateway BYOK ou secret store fournisseur |
| Budget runtime agent | tokens contexte/sortie modèle | Coût et pression de contexte pendant le travail des agents | Code Mode, recherche outil, résumés, plafonds budget |

Un token de déploiement Worker ne doit pas aussi être la manière dont l’app appelle les fournisseurs LLM. De même, une clé fournisseur LLM ne doit pas être disponible pour un agent de gestion d’infrastructure sauf si la tâche l’exige explicitement.

## AI Gateway BYOK pour les clés fournisseur

Pour les apps IA déployées, préférez Cloudflare AI Gateway avec BYOK / clés fournisseur stockées aux clés fournisseur brutes dans les secrets Worker.

Pattern production recommandé :

1. Le propriétaire sécurité/admin stocke les clés fournisseur dans Cloudflare AI Gateway ou un secret manager intégré.
2. Le code applicatif référence la clé stockée ou la route gateway, pas la clé fournisseur en clair.
3. Développeurs et agents peuvent déployer du code qui référence des clés approuvées, mais ne peuvent pas lire la valeur de clé.
4. AI Gateway applique budgets, limites de débit, cache, fallback et audit logging.
5. Les routes dynamiques ou politiques gateway plafonnent les boucles qui s’emballent avant qu’elles deviennent des incidents de facturation.

Utilisez des secrets Worker directs pour les clés fournisseur uniquement quand AI Gateway ne prend pas encore en charge le fournisseur/workflow, ou pendant du développement local court-vécu. Documentez l’exception et migrez-la derrière Gateway dès que possible.

Caveat fournisseur : certains SDKs/fournisseurs exigent encore une signature directe par clé API ou ne sont pas entièrement compatibles OpenAI. Traitez-les comme des exceptions explicites avec des secrets plus étroits et des budgets plus serrés.

## Pattern de sécurité pour agents IA

Les agents IA ne doivent pas détenir directement de larges tokens Cloudflare. Préférez cette hiérarchie :

1. **Contexte read-only :** docs, `wrangler.jsonc`, types générés et sortie de commande assainie.
2. **Commandes OAuth locales :** Wrangler authentifié par humain avec `env -u CLOUDFLARE_API_TOKEN`.
3. **Scripts broker :** scripts commités exposant des opérations sûres comme `deploy-preview`, `apply-local-migrations` ou `tail-logs`.
4. **Workflows CI :** déploiements et migrations production depuis GitHub Actions avec secrets scopés.
5. **Token break-glass :** temporaire, borné dans le temps, révoqué manuellement après la tâche.

Bonne commande exposée à l’agent :

```bash
pnpm cf:deploy-preview
```

Commande risquée exposée à l’agent :

```bash
CLOUDFLARE_API_TOKEN=... wrangler deploy --env production
```

## Scripts de dépôt à préférer

Ajoutez des scripts projet pour que les agents n’inventent pas de commandes privilégiées :

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

Pour les scripts CI-only, documentez qu’ils nécessitent des secrets injectés et ne doivent pas être lancés localement par des agents.

## Stockage des secrets

| Contexte | Stocker les tokens dans | Éviter |
|---------|-----------------|-------|
| Machine humaine locale | Bitwarden Secrets Manager ou Infisical | Exports dans le profil shell, `.env`, apps de notes |
| Runtime app local | Cloudflare `wrangler secret put` ou injection par secret manager local | `.dev.vars` commités avec vraies valeurs |
| CI/CD | Secrets/environnements GitHub Actions, Infisical, Bitwarden Secrets Manager | Valeurs en clair dans YAML de workflow |
| Runtime Worker | Secrets/bindings Cloudflare | Variables env frontend bundlées |
| Outillage IA/MCP | Commandes brokerées ou tokens étroits court-vécus | Token de compte partagé tout usage |

Ne commitez jamais de vrais identifiants Cloudflare. `.env.example` peut lister uniquement les noms de variables.

## Gates production

Pour les opérations qui affectent la production, exigez au moins un gate :

- approbation d’environnement GitHub protégé
- approbation manuelle `workflow_dispatch`
- protection de branche + PR relue
- service broker qui valide les IDs de ressources autorisées
- token Cloudflare avec seulement la ressource et la permission cibles

Les migrations D1 production, éditions DNS, changements de route Worker et paramètres de niveau compte ne doivent jamais être des effets de bord silencieux d’une session de code IA.

## Réponse à incident

Si un token a pu fuiter :

1. Révoquez immédiatement le token dans Cloudflare.
2. Cherchez dans repo, PRs, logs, sortie CI, commentaires d’issues et transcriptions d’agents la valeur ou le préfixe.
3. Faites tourner les identifiants downstream auxquels le token pouvait accéder ou qu’il pouvait écraser.
4. Examinez les audit logs Cloudflare pour les déploiements, éditions DNS, écritures de données et nouveaux tokens.
5. Ajoutez un token de remplacement plus étroit seulement après compréhension de l’incident.

## Checklist agent

Avant de demander à un agent IA de lancer des commandes Cloudflare, confirmez :

- [ ] La commande utilise OAuth localement ou un secret CI scopé.
- [ ] `CLOUDFLARE_API_TOKEN` n’est pas exporté globalement.
- [ ] Le token ne peut pas éditer le DNS sauf si la tâche est explicitement liée au DNS.
- [ ] Le token ne peut pas éditer des ressources D1/R2/KV hors du projet cible.
- [ ] L’opération est scriptée et relisible.
- [ ] Les déploiements/migrations production nécessitent une approbation humaine.
- [ ] Tout token temporaire a un propriétaire et une date de suppression.

## Guides liés

- [Deployment Guide](/fr/deployment/)
- [Environment and Secrets](/fr/environment-secrets/)
- [Cloudflare Compute](/fr/cloudflare-compute/)
- [MCP Guide](/fr/mcp-guide/)
