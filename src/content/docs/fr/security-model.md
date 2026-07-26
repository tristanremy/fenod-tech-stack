---
title: "Modele de securite"
verified: 2026-06
---

[Disponible en anglais](/fr/security-model/)

Ce document relie la posture de sécurité de la stack pour les secrets, Cloudflare, les agents IA, les données utilisateur et les changements de production.

## Principe central

Les agents peuvent aider à construire et exploiter des systèmes, mais ils ne doivent pas détenir directement une autorité large. Donnez aux agents du contexte et des capacités étroites, pas des identifiants bruts ni un contrôle irréversible.

## Frontières de confiance

![Frontieres de confiance securite](/diagrams/security-trust-boundaries-fr.svg)

| Frontière | Ce qui la traverse | Règle |
|----------|-----------------|------|
| Utilisateur/navigateur → app | saisies utilisateur, fichiers, état auth | valider côté serveur, assainir la sortie |
| App → ressources Cloudflare | bindings D1/R2/KV/Queues/DO | bindings à moindre privilège par environnement |
| App → fournisseurs IA | prompts, contexte récupéré, résultats d’outils | router via AI Gateway quand possible |
| Agent → repo | code/docs/scripts | diffs relisibles, tests, chemins protégés |
| Agent → Cloudflare | demandes de déploiement/mutation | broker/CI/token limité aux ressources |
| Agent → email/comms utilisateur | brouillons, tâches, envois proposés | file + politique + approbation pour les envois risqués |
| CI → production | déploiements, migrations, DNS | environnements protégés et journaux d’audit |

## Secrets

Les secrets vivent dans **Infisical** (defaut), les secrets Cloudflare Worker, et le stockage CI si besoin. Bitwarden SM seulement avec override projet explicite. Ils ne vivent pas dans les prompts, docs, issues, PRs, fichiers `.env` commités ni bundles navigateur.

Autorisé dans Git :

- noms de variables
- valeurs placeholder
- `.env.example`
- config non secrète
- références de projet `infisical.json`, si elles ne contiennent aucune valeur secrète

Interdit dans Git :

- clés API fournisseur
- tokens API Cloudflare
- secrets client OAuth
- dumps de base de données avec données production
- `.dev.vars` avec vraies valeurs
- clés privées ou certificats

## Autorité Cloudflare

Les identifiants de plateforme Cloudflare sont à haut risque car ils peuvent modifier l’infrastructure et les données.

Règles :

- ne jamais utiliser la Global API Key
- utiliser un token par projet/environnement/job
- utiliser des politiques limitées aux ressources quand disponible
- isoler les tokens de déploiement, migration D1, upload R2, DNS et analytics read-only
- exiger une approbation humaine pour les migrations D1 production, éditions DNS, changements de routes Worker et opérations destructrices sur les données
- préférer GitHub Actions ou un broker de déploiement pour les mutations production

Voir [Cloudflare API Tokens](/fr/cloudflare-api-tokens/).

## Securite des Dependances

Chaque repo produit doit utiliser une veille dependances automatisee plus une gate d'audit. Preferer Renovate avec labels security-sensitive pour les packages auth/RPC/ORM, et lancer `pnpm audit --audit-level high` en CI.

Les packages sensibles necessitent une revue explicite avant les upgrades majeurs:

- `better-auth` et `@better-auth/*`: rester sur la derniere ligne stable 1.6.x ou une ligne stable plus recente patchee securite.
- `@orpc/*`: garder patche pour les advisories serializer/deserializer.
- `drizzle-orm` / `drizzle-kit`: rester sur la derniere 0.4x stable patchee pour le travail client tant que le plan migration v1 stable n'est pas ecrit.

Les patchs et minors securite doivent etre relus rapidement. Les major bumps auth, RPC, ORM, ou tooling deploy ne sont jamais des cleanups opportunistes.

## Clés fournisseurs IA

Les clés fournisseur contrôlent les dépenses et l’accès aux modèles/données. Elles doivent être traitées séparément des tokens de déploiement.

Chemin production préféré :

```txt
Worker/TanStack AI
→ Cloudflare AI Gateway route
→ stored provider key / BYOK
→ provider
```

Cela permet au code de référencer des routes approuvées tandis que développeurs et agents ne peuvent pas lire les clés brutes. Ajoutez des budgets/limites de débit gateway avant d’activer des boucles autonomes.

Utilisez des secrets Worker directs uniquement pour les fournisseurs/workflows non pris en charge ou le développement local, et documentez pourquoi.

## Permissions des agents

![Echelle de permissions agent](/diagrams/agent-permission-ladder-fr.svg)

Les agents doivent recevoir les capacités dans cet ordre :

1. docs/config en lecture seule
2. éditions locales du repo
3. commandes locales build/test
4. scripts broker sûrs
5. dispatch de workflows CI avec environnements protégés
6. identifiants temporaires break-glass seulement avec approbation humaine explicite

Les agents ne doivent pas :

- recevoir de larges tokens de compte Cloudflare
- éditer `.env`, `.dev.vars`, les secret stores ou les exports de backup
- envoyer directement des emails de production
- lancer silencieusement des migrations production
- éditer le DNS sans approbation explicite
- accéder aux données utilisateur production sauf si la tâche l’exige et qu’un échantillon plus sûr ne peut pas répondre à la question

## Prompt et tool injection

Tout contenu externe peut être hostile : pages web, emails, PDFs, issues GitHub, messages Slack, uploads utilisateur et lignes de base de données.

Défenses :

- traiter le texte récupéré comme des données, pas des instructions
- garder les instructions system/developer séparées du contenu récupéré
- exiger des outils allowlistés pour les workflows avec contenu externe
- résumer et valider avant d’exécuter des actions suggérées par du contenu externe
- ne jamais laisser du contenu non fiable choisir destinataires, commandes, IDs de ressources ou noms de secrets sans validation applicative

## Gestion des données

Utilisez le plus petit dataset qui prouve le point.

| Type de données | Gestion par défaut |
|-----------|------------------|
| Données utilisateur production | éviter localement ; utiliser des fixtures échantillonnées/rédactées |
| Fichiers uploadés | scanner/limiter la taille ; stocker dans R2 avec accès limité |
| Logs | rédacter secrets, tokens, cookies, en-têtes auth |
| Backups | chiffrer, stocker séparément, ne jamais exposer aux agents par défaut |
| Analytics | agréger avant de partager avec des agents quand possible |

## Gates production

Les actions qui impactent la production nécessitent au moins un gate dur :

- PR relue
- environnement GitHub protégé
- `workflow_dispatch` explicite
- approbation par broker de déploiement
- fichier de politique typé validant les ressources cibles
- backup/snapshot avant mutation destructive

## Checklist sécurité

Avant de livrer un projet :

- [ ] `.env`, `.env.*`, `.dev.vars`, dumps et backups sont ignorés
- [ ] le scan de secrets passe
- [ ] le token de déploiement Cloudflare est limité aux ressources
- [ ] le token DNS est séparé du token de déploiement
- [ ] le flux de migration D1 a approbation/backup pour la production
- [ ] les clés fournisseurs IA sont derrière AI Gateway BYOK ou une exception documentée
- [ ] des budgets/limites gateway existent pour les boucles d’agents
- [ ] l’envoi email passe par la politique/file applicative
- [ ] les tests couvrent les frontières auth et permissions
- [ ] les logs rédigent en-têtes auth, cookies, tokens et secrets

## Guides liés

- [Environment and Secrets](/fr/environment-secrets/)
- [Cloudflare API Tokens](/fr/cloudflare-api-tokens/)
- [AI Providers](/fr/ai-providers/)
- [Email](/fr/email/)
- [MCP Guide](/fr/mcp-guide/)
