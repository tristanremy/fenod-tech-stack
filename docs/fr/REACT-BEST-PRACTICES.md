# Bonnes pratiques React

> Version courte: garder le React simple, accessible, securise et facile a modifier par des agents. Utiliser avec React Doctor avant push ou merge.

## Regles par defaut

1. Composants petits, nommes avec le vocabulaire produit.
2. Donnees serveur dans TanStack Query ou route loaders, pas dupliquees en state local.
3. Valeurs derivees pendant le render; eviter `useState` + `useEffect` pour recopier des props/data.
4. `useEffect` uniquement pour de vrais effets de bord.
5. Config statique hors des composants: colonnes, labels, nav items.
6. `useMemo` seulement pour calcul couteux ou props stables utiles.
7. Hooks custom pour comportement reutilisable, pas pour cacher une logique one-shot.
8. Formulaires types avec schema et labels visibles.
9. Boutons icon-only avec `aria-label`.
10. Eviter `dangerouslySetInnerHTML`; si necessaire, sanitization et justification.

## Securite et accessibilite

- Pas de HTML brut non sanitise.
- Pas de secrets dans le code client ou les variables publiques.
- Validation cote serveur meme si le formulaire valide cote client.
- HTML semantique avant ARIA.
- Chaque input a un label ou nom accessible.
- Chaque action destructive a confirmation ou undo.
- Liens externes en nouvel onglet avec `rel="noreferrer"`.

## Template React Doctor

Ajouter dans les apps React sous `react-doctor.config.json`:

```json
{
  "lint": true,
  "deadCode": true,
  "verbose": true,
  "diff": false,
  "failOn": "error",
  "ignore": {
    "rules": [],
    "files": ["src/routeTree.gen.ts", "src/generated/**"],
    "overrides": []
  }
}
```

Ignorer les regles le moins possible. Preferer des ignores de fichiers generes plutot que des ignores globaux.

## Scripts requis

```json
{
  "scripts": {
    "doctor:react": "react-doctor .",
    "doctor:react:diff": "react-doctor . --diff main",
    "doctor:react:staged": "react-doctor . --staged"
  }
}
```

Avant push UI:

```bash
pnpm doctor:react:diff
```

Regle de merge: score React Doctor `75+`; score sous `50` bloque sauf approbation explicite.

## Checklist agent

- [ ] pas de state derive dans des effects
- [ ] cleanup des effects si necessaire
- [ ] pas de composants imbriques recrees au render
- [ ] pas d'index key pour listes mutables
- [ ] boutons icon-only labels
- [ ] pas de HTML unsafe ou secrets client
- [ ] `pnpm doctor:react:diff` passe ou findings documentes
