---
title: "Workflow de Développement avec l'IA"
verified: 2026-06
---

L'objectif n'est pas de laisser l'IA "écrire l'app". L'objectif est de raccourcir les boucles de feedback tout en gardant l'architecture, les tests et les décisions produit sous contrôle.

## Rôle des Outils

| Outil | Meilleur usage |
|------|----------------|
| Cursor | Éditions inline, navigation locale, iteration UI rapide, petits refactors |
| Claude Code | Changements à l'échelle du repo, terminal, migrations, documentation et raisonnement multi-fichiers |
| VS Code | Éditeur de secours, extensions et workflows non IA |
| Docker + MCP Gateway | Chargement dynamique des outils sans transporter toute la définition des outils dans le contexte |
| Chrome DevTools MCP | Inspection navigateur, reproduction, vérification du DOM et debug réseau |
| Wrangler | Workflows Cloudflare locaux, bindings, logs et commandes de déploiement |

## Principes de Base

1. Partir du problème utilisateur, pas d'un outil.
2. Demander à l'IA d'inspecter avant d'éditer.
3. Contraindre le diff au plus petit changement correct.
4. Vérifier avec des tests, le typecheck et des contrôles manuels ciblés.
5. Capturer les patterns réutilisables dans la doc pour que les prompts s'ameliorent avec le temps.

## Workflow par Défaut

### 1. Cadrer la tache

Donnez à l'IA le comportement attendu, la contrainte et les critères d'acceptation.

Un bon cadrage contient:

- le resultat visible pour l'utilisateur
- les fichiers ou la zone à inspecter d'abord
- des contraintes comme "n'ajoute pas de dépendances" ou "préserve l'API actuelle"
- des étapes de vérification comme `pnpm test`, `pnpm typecheck` ou un chemin manuel dans le navigateur

### 2. Laisser l'IA inspecter le système existant

Avant de changer le code, faites lire à l'agent le code, la doc et les patterns existants. Cela réduit le risque d'introduire une deuxième architecture dans le même repo.

### 3. Faire le plus petit changement viable

Préférer:

- patcher une seule slice de feature
- réutiliser les helpers existants
- ajouter un test ciblé plutôt qu'une nouvelle couche de framework
- documenter une règle plutôt que la laisser prisonniere d'un prompt

### 4. Vérifier immédiatement

La vitesse de l'IA n'aide que si le feedback est rapide. Lancez d'abord les checks les plus étroits, puis elargissez la vérification quand le changement est stable.

- tests unitaires ou d'intégration ciblés
- typecheck
- lint ou format si le repo l'utilise
- chemin UI manuel ou inspection navigateur

### 5. Documenter ce qui doit se répéter

Si un pattern à de fortes chances de revenir, placez-le dans `docs/` plutôt que de compter sur la mémoire ou l'historique du chat.

## Formats de Prompts Qui Marchent Bien

### Prompt d'implémentation

```text
Task: add the smallest change that implements X.
Context: inspect the existing feature first and follow current patterns.
Constraints: do not add dependencies, keep the public API stable, avoid unrelated refactors.
Verify: run the relevant tests and typecheck.
Deliver: apply the change and explain any tradeoffs briefly.
```

### Prompt de refactor

```text
Refactor this area for clarity without changing behavior.
Read the current tests first.
Keep the diff minimal and preserve external contracts.
Run the existing verification steps after the edit.
```

### Prompt de debug

```text
Investigate this bug by reproducing it first.
Inspect logs, network, and browser state before changing code.
Explain the root cause, then implement the smallest fix and verify it.
```

## Là où l'IA Apporte le Plus de Valeur

- le scaffolding et les migrations
- l'implémentation slice par slice dans une codebase typée
- l'écriture ou l'extension de tests depuis un comportement clair
- les refactors avec contraintes existantes
- le debugging via le terminal et l'inspection navigateur
- la transformation d'une connaissance répétée en documentation

## Là où la Revue Humaine Doit Rester Forte

- les limites d'auth et de permissions
- les migrations de schéma ou de données irreversibles
- le pricing, l'analytics et les arbitrages produit
- les changements de dépendances avec impact sécurité ou bundle
- tout changement dont les critères d'acceptation sont encore flous

## Définition de terminé pour un Changement assisté par IA

- la tache était formulee en termes de comportement
- les patterns existants ont été inspectes avant l'édition
- le changement est reste local et intentionnel
- les tests ou les étapes de vérification ont été lances
- la connaissance réutilisable a été ajoutée à la doc quand c'était pertinent

## Guides Liés

- [MCP avec Claude Code](/fr/mcp-guide/)
- [TDD avec l'IA](/fr/tdd-with-ai/)
- [Guide de Tests](/fr/testing/)
- [Débogage](/fr/debugging/)
