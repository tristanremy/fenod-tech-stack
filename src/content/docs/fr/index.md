---
title: "Centre de Documentation"
verified: 2026-06
---

Utilisez ce dossier comme carte de travail de la stack Fenod. Le `README.md` racine présente la base; ces guides expliquent comment construire, tester, déployer et améliorer avec cette stack.

![Architecture de publication Starlight](/diagrams/starlight-publishing-fr.svg)

## Parcours de Lecture Recommandés

### Démarrer un nouveau projet

1. [Vue d'ensemble de la Stack](/fr/stack-overview/)
2. [Outillage](/fr/tooling/)
3. [Guide de Migration](/fr/migration/)
3. [Stratégie de Développement](/fr/development-strategy/)
4. [Patterns de Code](/fr/code-patterns/)
5. [Bonnes pratiques React](/fr/react-best-practices/)

### Construire avec l'IA

1. [Workflow de Développement avec l'IA](/fr/ai-development-workflow/)
2. [Modèle de sécurité](/fr/security-model/)
3. [MCP avec Claude Code](/fr/mcp-guide/)
3. [TDD avec l'IA](/fr/tdd-with-ai/)
4. [Guide de Tests](/fr/testing/)
5. [Débogage](/fr/debugging/)

### Aller en production

1. [Guide de Déploiement](/fr/deployment/)
2. [Environnements et secrets](/fr/environment-secrets/)
3. [Tokens API Cloudflare](/fr/cloudflare-api-tokens/)
4. [Modèle de sécurité](/fr/security-model/)
5. [Email](/fr/email/)
6. [Guide d'Amélioration d'App](/fr/app-improvement-guide/)
5. [Débogage](/fr/debugging/)
6. [État de l'Outillage Local](/fr/local-toolchain/)

### Surfaces produit et contenu

1. [Guide SEO Astro](/fr/astro-seo-guide/)
2. [Récupération de données TanStack](/fr/tanstack-data-fetching/)
3. [Guide Offline-First](/fr/offline-first-guide/)

## Guides par Thème

### Fondations

| Guide | Utilisez-le pour |
|-------|------------------|
| [Vue d'ensemble de la Stack](/fr/stack-overview/) | Choisir les valeurs par défaut principaux et éviter la dispersion de la stack |
| [Outillage](/fr/tooling/) | Defaults VoidZero, Vite, Vitest, Ultracite, tsgo, Rolldown et tsdown |
| [Guide de Migration](/fr/migration/) | Passer du scaffold à un projet prêt pour la production |
| [Stratégie de Développement](/fr/development-strategy/) | Exécuter un delivery par phases avec une approche UI-first |
| [Patterns de Code](/fr/code-patterns/) | Réutiliser des patterns d'implémentation à travers la stack |
| [Bonnes pratiques React](/fr/react-best-practices/) | Règles simples React pour agents, PRs, sécurité, accèssibilite et React Doctor |

### IA et Workflow

| Guide | Utilisez-le pour |
|-------|------------------|
| [Workflow de Développement avec l'IA](/fr/ai-development-workflow/) | Definir le modèle de travail quotidien avec Cursor, Claude Code, MCP et la vérification |
| [Modèle de sécurité](/fr/security-model/) | Secrets, agents, autorité Cloudflare, prompt injection, données et gates production |
| [Fournisseurs IA](/fr/ai-providers/) | Workers AI, AI Gateway, Replicate — guide des modèles et comparatif providers |
| [MCP avec Claude Code](/fr/mcp-guide/) | Charger les outils dynamiquement, inspecter le navigateur et piloter Cloudflare |
| [TDD avec l'IA](/fr/tdd-with-ai/) | Rendre la sortie de l'IA plus sûre avec des boucles red/green/refactor |
| [Guide de Tests](/fr/testing/) | Structurer Vitest, Playwright, MSW, React Doctor et l'organisation des tests |
| [Débogage](/fr/debugging/) | Deboguer le navigateur, les logs et l'edge runtime |

### Livraison et Durcissement

| Guide | Utilisez-le pour |
|-------|------------------|
| [Guide de Déploiement](/fr/deployment/) | Déployer sur Cloudflare, configurer le CI/CD et les bindings |
| [Environnements et secrets](/fr/environment-secrets/) | Infisical, secrets Cloudflare et env de déployer sécurisée |
| [Tokens API Cloudflare](/fr/cloudflare-api-tokens/) | Tokens à privilege minimal, garde-fous IA et usage Wrangler sécurisé |
| [Modèle de sécurité](/fr/security-model/) | Modèle transversal pour secrets, agents, données et changements production |
| [Email](/fr/email/) | Email inbound Cloudflare, outbound transactionnel, deliverability et workflows agents |
| [Guide d'Amélioration d'App](/fr/app-improvement-guide/) | Renforcer la performance, la résilience et l'opérabilité |
| [État de l'Outillage Local](/fr/local-toolchain/) | Auditer ce qui est installe localement et ce qui doit rester principal |
| [Les Primitives de Calcul Cloudflare](/fr/cloudflare-compute/) | Worker vs Dynamic Worker vs Container: quand utiliser chacun |

### Frontend et Surfaces Produit

| Guide | Utilisez-le pour |
|-------|------------------|
| [Récupération de données TanStack](/fr/tanstack-data-fetching/) | Choisir entre loaders, queries et patterns hybrides |
| [Guide SEO Astro](/fr/astro-seo-guide/) | Structurer le SEO pour les projets à fort contenu |
| [Guide Offline-First](/fr/offline-first-guide/) | Mettre en place le PWA, l'IndexedDB, la sync et la résilience |

## Notes

- Les details spécifiques à la machine vont dans [État de l'Outillage Local](/fr/local-toolchain/), pas dans le `README.md` racine.
- Les pratiques réutilisables doivent vivre dans `docs/`; les particularités d'un seul projet doivent rester dans ce projet.
