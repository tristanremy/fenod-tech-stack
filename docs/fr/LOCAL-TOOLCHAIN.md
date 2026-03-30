# Etat de l'Outillage Local

Snapshot pris le `2026-03-30` pour la machine qui maintient actuellement ce repository. Utilisez-le comme base de travail, pas comme exigence universelle.

## Outils JavaScript Principaux

| Outil | Version | Role |
|------|---------|------|
| `node` | `v22.22.2` | Runtime JavaScript par defaut |
| `npm` | `10.9.7` | Package manager fourni et CLI de secours |
| `pnpm` | `10.33.0` | Package manager recommande pour les commandes du repo |
| `bun` | `1.3.11` | Runtime secondaire et CLI utilitaire |
| `deno` | `2.7.9` | Runtime secondaire pour scripts ou outils specifiques |

## Editeurs et Outils IA

| Outil | Version | Role |
|------|---------|------|
| `code` | `1.113.0` | VS Code de secours et ecosysteme d'extensions |
| `cursor` | `2.6.21` | Surface principale de codage assiste par IA cote editeur |
| `claude` | `2.1.85` | IA terminal pour les changements a l'echelle du repo |

## Source Control et Outils Plateforme

| Outil | Version | Role |
|------|---------|------|
| `git` | `2.50.1` | Controle de source |
| `gh` | `2.89.0` | CLI GitHub |
| `docker` | `29.3.1` | Conteneurs, gateway MCP et services locaux |
| `wrangler` | `4.77.0` | Developpement et deploiement Cloudflare |
| `brew` | `5.1.1` | Package manager systeme |

## Toolchains de Support

| Outil | Version | Role |
|------|---------|------|
| `python3` | `3.12.13` | Scripts utilitaires et support de l'ecosysteme Python |
| `uv` | `0.11.2` | Gestion rapide des packages et environnements Python |
| `rustc` | `1.94.1` | Support des outils natifs |
| `cargo` | `1.94.1` | Package manager et build tool Rust |

## Non Installe Actuellement

| Outil | Statut | Notes |
|------|--------|-------|
| `cloudflared` | non installe | Utile pour les tunnels et certains workflows de preview |
| `pipx` | non installe | Pratique si l'usage de CLIs Python augmente |
| `go` | non installe | Utile seulement si un outil concret en depend |
| `gemini` | non installe | Deuxieme CLI IA optionnelle |
| `aider` | non installe | Workflow IA terminal optionnel |
| `opencode` | non installe | CLI alternative de codage assiste par IA |

## Ce que ce Setup Fait Deja Bien

- le developpement moderne d'applications TypeScript
- les workflows de deploiement Cloudflare-first
- l'edition assistee par IA avec Cursor et Claude Code
- l'usage d'outils Python ou Rust quand un script de support en a besoin

## Ce qui Doit Rester Principal

- `node` + `pnpm` pour les commandes et exemples au niveau du repo
- `wrangler` + `docker` pour les workflows plateforme et infra locale
- `cursor` ou `code` cote editeur, avec `claude` pour le travail oriente terminal

`bun` et `deno` sont utiles a avoir installes, mais le repo ne doit pas les exiger par defaut tant que la direction de la stack ne change pas.

## Ajouts Possibles

1. Installer `cloudflared` si les tunnels de preview, callbacks ou partages navigateur/appareil deviennent frequents.
2. Installer `pipx` si les CLIs Python deviennent un element regulier du workflow.
3. Ajouter une deuxieme CLI IA seulement si vous voulez comparer des modeles, pas juste accumuler des outils.
4. Ajouter `go` uniquement lorsqu'une dependance concrete ou un outil interne en a besoin.

## Guides Lies

- [Vue d'ensemble de la Stack](./STACK-OVERVIEW.md)
- [Workflow de Developpement avec l'IA](./AI-DEVELOPMENT-WORKFLOW.md)
- [MCP avec Claude Code](./MCP-GUIDE.md)
