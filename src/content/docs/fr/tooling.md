---
title: "Tooling"
verified: 2026-06
---

[Disponible en anglais](/fr/tooling/)

Ce guide définit l’orientation de l’outillage JavaScript/TypeScript pour les projets Fenod. L’objectif est un retour rapide, une configuration minimale et un chemin cohérent que les agents peuvent suivre.

## Stack par défaut

![Pipeline outillage VoidZero](/diagrams/voidzero-tooling-pipeline-fr.svg)

| Couche | Défaut | Notes |
|-------|---------|-------|
| Runtime | Node 24 | Base pour les commandes applicatives et CI |
| Gestionnaire de paquets | pnpm | Défaut pour les workspaces et scripts |
| Base dev/build | Vite | Via TanStack Start, Astro ou des apps Vite directes |
| Lanceur de tests | Vitest | Tests unitaires/intégration avec config compatible Vite |
| Tests navigateur | Playwright | Parcours utilisateur, régressions, captures si nécessaire |
| Lint/format | Ultracite + Oxlint/Oxfmt | Préférer une commande repo unique aux stacks ESLint/Prettier sur mesure |
| Vérification de types | tsgo | Vérification TypeScript rapide quand elle est prise en charge |
| Builds de paquets | tsdown | Défaut pour les bibliothèques/paquets internes |
| Orchestration monorepo | Turborepo | Seulement quand la forme du repo l’exige |

## Orientation VoidZero

L’outillage VoidZero fait maintenant partie de la strategie plateforme Cloudflare apres l'acquisition de VoidZero par Cloudflare en juin 2026. Cela valide le default Fenod runtime Cloudflare-first plus tooling Vite/Vitest/Oxc/Rolldown, mais cree aussi un risque de concentration assume: la stack s'appuie fortement sur un meme ecosysteme vendor.

- **Vite 8** comme base dev/build pour les nouveaux projets
- **Vitest** pour les tests
- **Oxlint/Oxfmt** comme bases rapides de lint/format
- **Rolldown** comme bundler default de Vite 8
- **tsdown** pour les builds de paquets/bibliothèques
- **Vite+** comme point d’entrée unifié expérimental pour les prototypes

Posture d’adoption :

| Outil | À utiliser maintenant | À essayer quand | À éviter quand |
|------|---------|----------|------------|
| Vite 8 | oui pour les nouveaux projets | default | une app Vite 7 existante a besoin d'une migration en deux etapes moins risquee |
| `rolldown-vite` | pont de migration | une app Vite 7 veut isoler les problemes bundler avant Vite 8 | nouveaux projets; utiliser Vite 8 directement |
| Vitest | oui | par défaut | un comportement purement navigateur est requis ; utiliser Playwright |
| Ultracite | oui | gate lint/format par défaut | le repo a un standard existant fort à préserver |
| tsdown | oui pour les paquets | remplacement de configs tsup/Rollup | les builds d’app sont gérés par le framework |
| Vite+ | expérimental | prototypes et tests internes | baseline client de production avant stabilité suffisante |

### tsgo et TypeScript 7

tsgo est la toolchain native TypeScript 7 / Corsa et le chemin rapide pour les scripts de type-check et les gates CI. Il ne remplace pas complètement la toolchain TypeScript JavaScript / Strada pour tous les usages.

Garder `typescript` installé side-by-side pour les outils qui consomment l'API programmatique TypeScript: codemods, intégrations éditeur, checkers framework, et certains plugins lint. Supprimer `typescript` parce que `tsgo` est présent n'est pas un cleanup tant que l'API Corsa n'est pas stabilisée et que les outils concernés n'ont pas migré.

Posture actuelle: garder `typescript` pour les consommateurs d'API et utiliser tsgo/native preview seulement via des scripts explicites comme `pnpm typecheck`.

## Défauts de build de paquets

Pour les paquets internes :

- sortie ESM-first
- exports typés
- map `exports` explicite
- pas de Rollup personnalisé sauf besoin concret de plugin
- smoke-test des imports de paquet avant publication/release

Exemple de scripts de paquet :

```json
{
  "scripts": {
    "build": "tsdown",
    "typecheck": "tsgo --noEmit",
    "test": "vitest run"
  }
}
```

## Échelle de vérification

Les agents et humains doivent exécuter d’abord le plus petit gate utile, puis monter quand le risque augmente.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Pour les changements UI :

```bash
pnpm test:e2e
```

Pour les changements fortement React, inclure React Doctor quand il est configuré :

```bash
pnpm doctor:react:diff
```

## Règles d’outillage pour les agents

- Préférer les scripts du repo aux commandes ad hoc.
- Ne pas ajouter de nouveaux outils lint/format/test sans supprimer ou intégrer l’ancien chemin.
- Ne pas changer de gestionnaire de paquets.
- Ne pas rendre Bun/Deno requis pour les commandes normales de l’app sauf si le projet les choisit explicitement.
- Ne pas supprimer le package `typescript` quand tsgo est présent; garder les deux side-by-side jusqu'à stabilisation de l'API Corsa et migration confirmée des outils dépendants.
- Si un build de paquet nécessite une config personnalisée, expliquer la limitation concrète que tsdown ne peut pas couvrir.

## Guides liés

- [Stack Overview](/fr/stack-overview/)
- [Testing Guide](/fr/testing/)
- [AI Development Workflow](/fr/ai-development-workflow/)
- [Local Toolchain Snapshot](/fr/local-toolchain/)
