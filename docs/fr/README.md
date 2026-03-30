# Centre de Documentation

Utilisez ce dossier comme carte de travail de la stack Fenod. Le `README.md` racine presente la base; ces guides expliquent comment construire, tester, deployer et ameliorer avec cette stack.

## Parcours de Lecture Recommandes

### Demarrer un nouveau projet

1. [Vue d'ensemble de la Stack](./STACK-OVERVIEW.md)
2. [Guide de Migration](./MIGRATION.md)
3. [Strategie de Developpement](./DEVELOPMENT-STRATEGY.md)
4. [Patterns de Code](./CODE-PATTERNS.md)

### Construire avec l'IA

1. [Workflow de Developpement avec l'IA](./AI-DEVELOPMENT-WORKFLOW.md)
2. [MCP avec Claude Code](./MCP-GUIDE.md)
3. [TDD avec l'IA](./TDD-WITH-AI.md)
4. [Guide de Tests](./TESTING.md)
5. [Debugging](./DEBUGGING.md)

### Aller en production

1. [Guide de Deploiement](./DEPLOYMENT.md)
2. [Guide d'Amelioration d'App](./APP-IMPROVEMENT-GUIDE.md)
3. [Debugging](./DEBUGGING.md)
4. [Etat de l'Outillage Local](./LOCAL-TOOLCHAIN.md)

### Surfaces produit et contenu

1. [Guide SEO Astro](./ASTRO-SEO-GUIDE.md)
2. [Data Fetching TanStack](./TANSTACK-DATA-FETCHING.md)
3. [Guide Offline-First](./OFFLINE-FIRST-GUIDE.md)

## Guides par Theme

### Fondations

| Guide | Utilisez-le pour |
|-------|------------------|
| [Vue d'ensemble de la Stack](./STACK-OVERVIEW.md) | Choisir les defaults principaux et eviter la dispersion de la stack |
| [Guide de Migration](./MIGRATION.md) | Passer du scaffold a un projet pret pour la production |
| [Strategie de Developpement](./DEVELOPMENT-STRATEGY.md) | Executer un delivery par phases avec une approche UI-first |
| [Patterns de Code](./CODE-PATTERNS.md) | Reutiliser des patterns d'implementation a travers la stack |

### IA et Workflow

| Guide | Utilisez-le pour |
|-------|------------------|
| [Workflow de Developpement avec l'IA](./AI-DEVELOPMENT-WORKFLOW.md) | Definir le modele de travail quotidien avec Cursor, Claude Code, MCP et la verification |
| [AI Providers](./AI-PROVIDERS.md) | Workers AI, AI Gateway, Replicate — guide des modeles et comparatif providers |
| [MCP avec Claude Code](./MCP-GUIDE.md) | Charger les outils dynamiquement, inspecter le navigateur et piloter Cloudflare |
| [TDD avec l'IA](./TDD-WITH-AI.md) | Rendre la sortie de l'IA plus sure avec des boucles red/green/refactor |
| [Guide de Tests](./TESTING.md) | Structurer Vitest, Playwright, MSW et l'organisation des tests |
| [Debugging](./DEBUGGING.md) | Deboguer le navigateur, les logs et l'edge runtime |

### Livraison et Durcissement

| Guide | Utilisez-le pour |
|-------|------------------|
| [Guide de Deploiement](./DEPLOYMENT.md) | Deployer sur Cloudflare, configurer le CI/CD et les bindings |
| [Guide d'Amelioration d'App](./APP-IMPROVEMENT-GUIDE.md) | Renforcer la performance, la resilience et l'operabilite |
| [Etat de l'Outillage Local](./LOCAL-TOOLCHAIN.md) | Auditer ce qui est installe localement et ce qui doit rester principal |
| [Les Primitives de Calcul Cloudflare](./CLOUDFLARE-COMPUTE.md) | Worker vs Dynamic Worker vs Container: quand utiliser chacun |

### Frontend et Surfaces Produit

| Guide | Utilisez-le pour |
|-------|------------------|
| [Data Fetching TanStack](./TANSTACK-DATA-FETCHING.md) | Choisir entre loaders, queries et patterns hybrides |
| [Guide SEO Astro](./ASTRO-SEO-GUIDE.md) | Structurer le SEO pour les projets a fort contenu |
| [Guide Offline-First](./OFFLINE-FIRST-GUIDE.md) | Mettre en place le PWA, l'IndexedDB, la sync et la resilience |

## Notes

- Les details specifiques a la machine vont dans [Etat de l'Outillage Local](./LOCAL-TOOLCHAIN.md), pas dans le `README.md` racine.
- Les pratiques reutilisables doivent vivre dans `docs/`; les particularites d'un seul projet doivent rester dans ce projet.
