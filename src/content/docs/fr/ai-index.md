---
title: "Index IA"
description: "Point d'entree rapide pour les agents IA qui utilisent la stack Fenod."
verified: 2026-06
---

Si tu es un agent IA dans un projet Fenod, lis cette page en premier. Elle pointe vers le contexte minimum pour prendre de bonnes decisions sans charger tout le handbook.

## A Lire en Premier

1. [Contrat de Stack](/fr/stack-contract/)
2. [Contrat Operationnel Agent](/fr/agent-operating-contract/)
3. [Pieges](/fr/gotchas/)
4. [Recettes](/fr/recipes/)
5. [Modele de Securite](/fr/security-model/)
6. [Tokens API Cloudflare](/fr/cloudflare-api-tokens/)

## Modele Mental par Defaut

Les projets Fenod sont Cloudflare-first, TypeScript-first et assistes par agents. Preferer une architecture simple, typee et edge-friendly aux couches d'abstraction enterprise.

## Defaults Rapides

| Zone | Defaut |
|------|--------|
| Runtime | Node 22 |
| Package manager | pnpm |
| App | TanStack Start |
| API | Hono + ORPC |
| Base de donnees | Drizzle + D1 |
| Auth | Better Auth |
| Styling | Tailwind v4 + shadcn/ui |
| IA | TanStack AI + Cloudflare AI Gateway |
| Deploiement | Cloudflare Workers/Pages + Alchemy |
| Secrets | Infisical + secrets Cloudflare Worker |
| Qualite | Ultracite, tsgo, Vitest, Playwright |

## Regle Simple pour Agents

En cas de doute, choisis la plus petite implementation qui respecte le contrat de stack, garde la type-safety et peut etre verifiee avec les scripts du repo.
