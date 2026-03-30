# TDD avec l'IA

L'IA permet de produire du code rapidement. Le TDD rend cette vitesse fiable.

## Pourquoi le TDD Compte Encore Plus avec l'IA

- l'IA produit facilement du code plausible, pas forcement du code correct
- un test rouge transforme une intention vague en contrat executable
- de petites boucles red/green/refactor evitent a l'IA de partir dans de grands rewrites
- le refactor devient plus sur car le comportement est fige avant que le modele ne reorganise le code

## La ou Cela Paie le Plus Vite

| Zone | Fit TDD | Pourquoi |
|------|---------|----------|
| Services et regles metier | Eleve | La logique est compacte, deterministe et facile a verifier |
| Routers, loaders et actions | Eleve | Les contrats publics comptent plus que l'implementation interne |
| Validation, parsing et mappers | Eleve | Les cas limites sont faciles a rater sans exemples |
| Flows UI critiques | Moyen | Il faut se concentrer sur le comportement utilisateur |
| UI purement presentielle | Faible | La revue manuelle coute souvent moins cher qu'un sur-test de style |

## Boucle Recommandee

### 1. Ecrire un test qui echoue

Partez du comportement voulu, pas de l'implementation attendue.

### 2. Demander a l'IA le plus petit changement qui le fait passer

N'y melangez pas cleanup, optimisation et rewrite d'architecture dans la meme etape.

### 3. Lancer le check le plus etroit utile

Commencez par le test cible. Ensuite seulement, elargissez la verification si le changement touche plusieurs couches.

### 4. Refactorer en restant au vert

Une fois le comportement protege, utilisez l'IA pour simplifier les noms, extraire les duplications ou s'aligner sur les patterns existants.

### 5. Ajouter le cas suivant

Faites grandir la couverture par comportement: cas limites, erreurs, regles d'auth, etats nuls et retries.

## Echelle de Prompts

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

## Forme de Test par Defaut chez Fenod

- Utiliser Vitest pour les services, utilitaires, validations et la logique metier par slice.
- Ajouter des tests d'integration autour des routers, loaders et actions quand les contrats sont importants.
- Garder Playwright pour des parcours end-to-end fins et critiques.
- Eviter de s'appuyer sur les snapshots comme source principale de confiance.

Pour des exemples concrets de setup, voir le [Guide de Tests](./TESTING.md).

## Echecs Frequents avec l'IA

- ecrire les tests apres l'implementation et appeler cela du TDD
- demander un gros rewrite au lieu du prochain petit pas
- accepter des assertions qui ne font que recopier l'implementation actuelle
- s'appuyer sur les snapshots quand des assertions de comportement seraient plus claires
- sauter la revue humaine du premier test rouge

## Definition of Done

- le comportement etait exprime dans un test avant ou pendant l'implementation
- les tests cibles passent apres le changement
- le code final est plus simple que le chemin utilise pour atteindre le vert
- le test protege un comportement visible pour l'utilisateur ou un contrat public

## Guides Lies

- [Guide de Tests](./TESTING.md)
- [Workflow de Developpement avec l'IA](./AI-DEVELOPMENT-WORKFLOW.md)
- [Patterns de Code](./CODE-PATTERNS.md)
