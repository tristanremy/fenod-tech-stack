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
| Runtime | Node 22 | Base pour les commandes applicatives et CI |
| Gestionnaire de paquets | pnpm | Défaut pour les workspaces et scripts |
| Base dev/build | Vite | Via TanStack Start, Astro ou des apps Vite directes |
| Lanceur de tests | Vitest | Tests unitaires/intégration avec config compatible Vite |
| Tests navigateur | Playwright | Parcours utilisateur, régressions, captures si nécessaire |
| Lint/format | Ultracite + Oxlint/Oxfmt | Préférer une commande repo unique aux stacks ESLint/Prettier sur mesure |
| Vérification de types | tsgo | Vérification TypeScript rapide quand elle est prise en charge |
| Builds de paquets | tsdown | Défaut pour les bibliothèques/paquets internes |
| Orchestration monorepo | Turborepo | Seulement quand la forme du repo l’exige |

## Orientation VoidZero

L’outillage VoidZero est la direction pour la toolchain JS :

- **Vite** comme base dev/build
- **Vitest** pour les tests
- **Oxlint/Oxfmt** comme bases rapides de lint/format
- **Rolldown** pour des builds bundlés plus rapides à mesure qu’il mûrit
- **tsdown** pour les builds de paquets/bibliothèques
- **Vite+** comme point d’entrée unifié expérimental pour les prototypes

Posture d’adoption :

| Outil | À utiliser maintenant | À essayer quand | À éviter quand |
|------|---------|----------|------------|
| Vite | oui | par défaut | le framework le masque complètement et aucune config n’est nécessaire |
| Vitest | oui | par défaut | un comportement purement navigateur est requis ; utiliser Playwright |
| Ultracite | oui | gate lint/format par défaut | le repo a un standard existant fort à préserver |
| Rolldown / `rolldown-vite` | sélectivement | le temps de build est douloureux ou l’app est grande | le travail client ne peut pas tolérer les cas limites du bundler |
| tsdown | oui pour les paquets | remplacement de configs tsup/Rollup | les builds d’app sont gérés par le framework |
| Vite+ | expérimental | prototypes et tests internes | baseline client de production avant stabilité suffisante |

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
- Si la performance de build pose problème, essayer Rolldown comme expérience et documenter les résultats avant de le standardiser.
- Si un build de paquet nécessite une config personnalisée, expliquer la limitation concrète que tsdown ne peut pas couvrir.

## Guides liés

- [Stack Overview](/fr/stack-overview/)
- [Testing Guide](/fr/testing/)
- [AI Development Workflow](/fr/ai-development-workflow/)
- [Local Toolchain Snapshot](/fr/local-toolchain/)
