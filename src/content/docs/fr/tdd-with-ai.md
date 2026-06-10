---
title: "TDD avec l'IA"
verified: 2026-06
---

L'IA facilite la production rapide de code. Le TDD rend cette vitesse fiable.

![Boucle TDD avec IA](/diagrams/tdd-ai-loop-fr.svg)

## Pourquoi le TDD compte encore plus avec l'IA

- L'IA sait produire du code plausible, pas du code garanti correct.
- Un test qui échoue transforme une intention vague en contrat exécutable.
- De petites boucles red/green/refactor empêchent l'IA de dériver vers de larges réécritures.
- Le refactoring devient plus sûr, car le comportement est verrouillé avant que le modèle ne réorganise le code.

## Là où cela paie le plus vite

| Zone | Pertinence du TDD | Pourquoi |
|------|-------------------|----------|
| Services et règles métier | Élevée | La logique est compacte, déterministe et facile à vérifier |
| Routers, loaders et actions | Élevée | Les contrats publics comptent plus que l'implémentation interne |
| Validation, parsing et mappers | Élevée | Les cas limites sont faciles à manquer sans exemples |
| Parcours UI critiques | Moyenne | Se concentrer sur le comportement utilisateur, pas sur les détails internes des composants |
| UI purement présentationnelle | Faible | La revue manuelle coûte souvent moins cher que des tests de style excessifs |

## Boucle recommandée

### 1. Écrire un test qui échoue

Partez du comportement voulu, pas de l'implémentation attendue.

### 2. Demander à l'IA le plus petit changement qui le fait passer

Ne demandez pas un nettoyage, une optimisation et une réécriture d'architecture dans la même étape.

### 3. Lancer la vérification utile la plus ciblée

Lancez d'abord le test ciblé. Élargissez ensuite la surface de vérification si le changement touche plusieurs couches.

### 4. Refactorer en restant au vert

Une fois le comportement protégé, utilisez l'IA pour simplifier les noms, extraire les duplications ou vous aligner sur les patterns existants.

### 5. Ajouter le cas suivant

Faites progresser la couverture par comportement : cas limites, chemins d'erreur, règles d'auth, états nuls et retries.

## Échelle de prompts

### Red

```text
Add one failing test that describes this behavior.
Keep the test focused on the public contract.
Do not change the implementation yet.
```

### Green

```text
Make the smallest code change that makes the new test pass.
Avoid unrelated refactors and preserve existing behavior.
Run the targeted test after the edit.
```

### Refactor

```text
Refactor for clarity without changing behavior.
Keep all tests green and preserve the current API.
```

## Forme de test par défaut chez Fenod

- Utiliser Vitest pour les services, utilitaires, validations et logique métier par slice.
- Ajouter des tests d'intégration autour des routers, loaders et actions quand les contrats comptent.
- Garder Playwright pour des parcours end-to-end fins et critiques.
- Éviter de s'appuyer sur les snapshots comme source principale de confiance.

Pour une configuration concrète et des exemples, consultez le [Guide de tests](/fr/testing/).

## Échecs fréquents avec l'IA

- écrire les tests après l'implémentation et appeler cela du TDD
- demander une large réécriture au lieu du prochain tout petit pas
- accepter des assertions qui ne font que refléter l'implémentation actuelle
- s'appuyer sur des snapshots quand des assertions de comportement seraient plus claires
- sauter la revue humaine du premier test qui échoue

## Définition de terminé

- le comportement a été exprimé dans un test avant ou pendant l'implémentation
- les tests ciblés sont passés après le changement
- le code final est plus simple que le chemin utilisé pour atteindre le vert
- le test protège un comportement visible par l'utilisateur ou un contrat public

## Guides liés

- [Guide de tests](/fr/testing/)
- [Workflow de développement avec l'IA](/fr/ai-development-workflow/)
- [Patterns de code](/fr/code-patterns/)
