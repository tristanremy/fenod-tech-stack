---
title: "Politique de Fraicheur"
description: "Comment le Fenod Stack Handbook suit la fraicheur documentaire."
verified: 2026-06
---

La stack evolue vite. Chaque page du handbook doit inclure un champ frontmatter `verified` au format `YYYY-MM`.

## Default Path

Quand une page change:

1. Verifier que la recommandation centrale est encore actuelle.
2. Mettre a jour la Source Locale anglaise d'abord.
3. Mettre a jour la page francaise ou signaler explicitement la derive de traduction.
4. Mettre `verified` au mois courant seulement si la recommandation a vraiment ete relue.
5. Lancer la Publishing Gate.

## Pages Obsoletes

Traiter une page comme obsolete quand:

- `verified` date de plus de six mois;
- les noms de packages, defaults framework, ou recommandations Cloudflare ont change;
- les exemples d'implementation ne correspondent plus au starter courant;
- un agent signale des instructions contradictoires.

## Agent Notes

Ne pas bump `verified` pour un changement cosmetique. Le bump seulement apres verification du fond de la page.

## Guides Lies

- [Contrat Operationnel Agent](/fr/agent-operating-contract/)
- [Contrat de Stack](/fr/stack-contract/)
- [Decisions](/fr/decisions/)
