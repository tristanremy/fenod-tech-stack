# Vue d'ensemble de la Stack

Il s'agit de la vue operationnelle de la stack Fenod: ce qui doit etre principal, ce qui reste optionnel, et comment la machine locale se traduit en workflow quotidien.

## Ce que Cette Stack Optimise

- un developpement produit type-safe avec peu de ceremonie
- une iteration rapide pour de petites equipes qui livrent a l'edge
- des patterns reutilisables pour les apps, les sites de contenu, les outils internes et les features IA
- un developpement assiste par IA avec des contraintes fortes plutot qu'une generation libre
- un chemin par defaut assez simple pour etre enseigne et assez rapide pour livrer

## Choix par Defaut

| Couche | Defaut | Pourquoi |
|--------|--------|----------|
| Runtime | Node 22 | Base stable pour l'ecosysteme et la doc d'equipe |
| Package manager | pnpm | Workspaces rapides, installs predictibles, bon fit monorepo |
| Framework applicatif | TanStack Start | React full-stack type-safe avec un bon story router/query |
| Framework contenu | Astro | Mieux adapte au contenu, au SEO et aux surfaces marketing |
| API | Hono + ORPC | Surface API fine, edge-friendly et type-safe |
| Base de donnees | Drizzle + D1 | Modele SQL simple aligne avec le deploiement Cloudflare |
| Auth | Better Auth | Bonne ergonomie TypeScript et setup adapte a D1 |
| Styling | Tailwind v4 + shadcn/ui | Delivery produit rapide avec une base de composants maintenable |
| Deploiement | Wrangler + Cloudflare | Cible par defaut pour apps, APIs et services edge |
| Editeur | Cursor ou VS Code | Workflow mature avec bon support d'extensions |
| IA terminal | Claude Code | Bon fit pour les changements a l'echelle du repo, le terminal et la doc |

## Installe ne Veut pas Dire Principal

Cette machine a plus d'un runtime et plus d'une surface de codage. C'est utile, mais cela peut aussi creer de la derive.

- `node` + `pnpm` doivent rester le defaut documente de ce repo.
- `bun` et `deno` sont des outils secondaires utiles, pas la base des commandes d'equipe.
- `python3` + `uv` et `rustc` + `cargo` sont de bons toolchains de support, mais pas le centre de la stack produit.
- `Cursor`, `VS Code` et `Claude Code` peuvent coexister si chaque outil a un role clair.

Pour le snapshot precis des versions, voir [Etat de l'Outillage Local](./LOCAL-TOOLCHAIN.md).

## Mode de Fonctionnement Recommande

### Garder un chemin par defaut pour livrer

- Documenter les commandes avec `pnpm`.
- Partir de Node 22 pour le local et la CI sauf exception explicite.
- Construire les apps produit avec TanStack Start sauf si Astro est clairement mieux adapte.
- Garder le backend fin avec Hono, ORPC, Drizzle et Better Auth.
- Traiter Cloudflare comme cible de deploiement par defaut, pas comme une etape ajoutee plus tard.

### Garder les outils secondaires optionnels

- Utiliser `bun` quand un outil y gagne vraiment.
- Utiliser `deno` quand un script ou runtime en depend explicitement.
- Utiliser Python ou Rust pour les utilitaires, CLIs ou besoins ecosysteme.
- Eviter d'ecrire des instructions de repo qui exigent tous les outils installes juste parce qu'ils existent sur une machine.

## Pourquoi Cette Stack Fonctionne Bien avec l'IA

- TypeScript strict donne des contraintes plus nettes a l'IA.
- L'architecture par slices garde les changements locaux.
- Les outils Cloudflare se pilotent bien depuis le terminal.
- Une bonne doc resserre les prompts et aligne mieux la sortie.
- Les tests et le typecheck fournissent la boucle de feedback rapide dont l'IA a besoin pour etre fiable.

## Priorites d'Amelioration

1. Garder une stack opinionnee: `pnpm`, Node 22, TanStack Start ou Astro, Cloudflare par defaut.
2. Rendre explicite le workflow IA au lieu de dependre de prompts ad hoc.
3. Introduire le TDD plus tot pour que le code genere par l'IA soit guide par un comportement executable.
4. Suivre la derive de l'outillage local pour que la doc colle a la realite.
5. Garder le `README.md` racine leger et deplacer les details operationnels dans des guides dedies.

## Guides Lies

- [Workflow de Developpement avec l'IA](./AI-DEVELOPMENT-WORKFLOW.md)
- [TDD avec l'IA](./TDD-WITH-AI.md)
- [Etat de l'Outillage Local](./LOCAL-TOOLCHAIN.md)
- [Strategie de Developpement](./DEVELOPMENT-STRATEGY.md)
