# Workflow de Developpement avec l'IA

L'objectif n'est pas de laisser l'IA "ecrire l'app". L'objectif est de raccourcir les boucles de feedback tout en gardant l'architecture, les tests et les decisions produit sous controle.

## Role des Outils

| Outil | Meilleur usage |
|------|----------------|
| Cursor | Editions inline, navigation locale, iteration UI rapide, petits refactors |
| Claude Code | Changements a l'echelle du repo, terminal, migrations, documentation et raisonnement multi-fichiers |
| VS Code | Editeur de secours, extensions et workflows non IA |
| Docker + MCP Gateway | Chargement dynamique des outils sans transporter toute la definition des outils dans le contexte |
| Chrome DevTools MCP | Inspection navigateur, reproduction, verification du DOM et debug reseau |
| Wrangler | Workflows Cloudflare locaux, bindings, logs et commandes de deploiement |

## Principes de Base

1. Partir du probleme utilisateur, pas d'un outil.
2. Demander a l'IA d'inspecter avant d'editer.
3. Contraindre le diff au plus petit changement correct.
4. Verifier avec des tests, le typecheck et des controles manuels cibles.
5. Capturer les patterns reutilisables dans la doc pour que les prompts s'ameliorent avec le temps.

## Workflow par Defaut

### 1. Cadrer la tache

Donnez a l'IA le comportement attendu, la contrainte et les criteres d'acceptation.

Un bon cadrage contient:

- le resultat visible pour l'utilisateur
- les fichiers ou la zone a inspecter d'abord
- des contraintes comme "n'ajoute pas de dependances" ou "preserve l'API actuelle"
- des etapes de verification comme `pnpm test`, `pnpm typecheck` ou un chemin manuel dans le navigateur

### 2. Laisser l'IA inspecter le systeme existant

Avant de changer le code, faites lire a l'agent le code, la doc et les patterns existants. Cela reduit le risque d'introduire une deuxieme architecture dans le meme repo.

### 3. Faire le plus petit changement viable

Preferer:

- patcher une seule slice de feature
- reutiliser les helpers existants
- ajouter un test cible plutot qu'une nouvelle couche de framework
- documenter une regle plutot que la laisser prisonniere d'un prompt

### 4. Verifier immediatement

La vitesse de l'IA n'aide que si le feedback est rapide. Lancez d'abord les checks les plus etroits, puis elargissez la verification quand le changement est stable.

- tests unitaires ou d'integration cibles
- typecheck
- lint ou format si le repo l'utilise
- chemin UI manuel ou inspection navigateur

### 5. Documenter ce qui doit se repeter

Si un pattern a de fortes chances de revenir, placez-le dans `docs/` plutot que de compter sur la memoire ou l'historique du chat.

## Formats de Prompts Qui Marchent Bien

### Prompt d'implementation

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

## La ou l'IA Apporte le Plus de Valeur

- le scaffolding et les migrations
- l'implementation slice par slice dans une codebase typee
- l'ecriture ou l'extension de tests depuis un comportement clair
- les refactors avec contraintes existantes
- le debugging via le terminal et l'inspection navigateur
- la transformation d'une connaissance repetee en documentation

## La ou la Revue Humaine Doit Rester Forte

- les limites d'auth et de permissions
- les migrations de schema ou de donnees irreversibles
- le pricing, l'analytics et les arbitrages produit
- les changements de dependances avec impact securite ou bundle
- tout changement dont les criteres d'acceptation sont encore flous

## Definition of Done pour un Changement Assiste par IA

- la tache etait formulee en termes de comportement
- les patterns existants ont ete inspectes avant l'edition
- le changement est reste local et intentionnel
- les tests ou les etapes de verification ont ete lances
- la connaissance reutilisable a ete ajoutee a la doc quand c'etait pertinent

## Guides Lies

- [MCP avec Claude Code](./MCP-GUIDE.md)
- [TDD avec l'IA](./TDD-WITH-AI.md)
- [Guide de Tests](./TESTING.md)
- [Debugging](./DEBUGGING.md)
