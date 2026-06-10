---
title: "Decisions"
description: "Decisions d'architecture derriere le Fenod Stack Handbook."
verified: 2026-06
---

Cette page resume les ADR legeres qui expliquent les decisions difficiles a inverser du handbook. Les fichiers ADR complets vivent dans le repo public sous `docs/adr/`.

## Decisions Acceptees

| ADR | Decision | Pourquoi c'est important |
|-----|----------|--------------------------|
| 0001 | Utiliser Starlight pour le Fenod Stack Handbook | Starlight est Markdown-first, bilingue, searchable, compatible Cloudflare, et facile a modifier par agents via diffs normaux. |
| 0002 | Utiliser ce repo public comme source de `stack.fenod.fr` | Le repo public rend le handbook transparent et lisible par IA, mais impose de garder les notes operationnelles privees ailleurs. |
| 0003 | Maintenir deux couches de documentation, humaine et agent | Les humains ont besoin de rationale et d'exemples; les agents ont besoin de contrats concis, defaults, pieges et commandes de verification. |

## Standard de Decision

Creer des ADRs avec parcimonie. Une decision merite une ADR seulement si elle est difficile a inverser, surprenante sans contexte, et issue d'un vrai trade-off.

## Liens Connexes

- [Contrat de Stack](/fr/stack-contract/)
- [Contrat Operationnel Agent](/fr/agent-operating-contract/)
- [Modele de Securite](/fr/security-model/)
