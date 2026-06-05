# Environnements et secrets

> Version courte: utiliser Infisical comme source de verite des secrets, ne pas commiter de fichiers `.env`, puis injecter les secrets dans le developpement local, CI et Cloudflare.

## Modele recommande

| Couche | Source de verite | Reception par l'app |
|--------|------------------|---------------------|
| Dev local | Projet Infisical | `infisical run -- pnpm dev` |
| Scripts / migrations | Projet Infisical | `infisical run -- pnpm db:migrate` |
| Secrets runtime Cloudflare | Sync Infisical vers Cloudflare Workers, ou injection au deploy | Bindings Worker / `alchemy.secret(...)` |
| Config non secrete | Config git ou Cloudflare `vars` | Bindings simples, `vars`, valeurs Alchemy |
| Identite CI | OIDC GitHub ou machine identity courte duree | Secrets recuperes au runtime du workflow |

## A stocker dans Infisical

- `CLOUDFLARE_API_TOKEN`, tokens email, tokens analytics
- `BETTER_AUTH_SECRET`
- secrets OAuth (`GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_SECRET`)
- deploy hooks et webhooks sensibles
- mot de passe/state encryption Alchemy si utilise

## A ne jamais commiter

- `.env`, `.env.local`, `.dev.vars`
- tokens Cloudflare
- secrets de machine identity Infisical
- exports de base de donnees ou backups avec donnees reelles

## Setup

```bash
brew install infisical/get-cli/infisical
infisical login
infisical init
```

`infisical.json` peut etre committe: il reference le projet Infisical sans contenir les valeurs secretes.

Environnements conseilles: `dev`, `staging`, `prod`.

## Commandes locales

```bash
infisical run --env=dev -- pnpm dev
infisical run --env=dev -- pnpm --filter server dev
infisical run --env=dev --path=/cloudflare -- pnpm db:migrate
```

Eviter de generer des fichiers dotenv. Si un outil l'exige, generer temporairement puis supprimer:

```bash
infisical export --env=dev --format=dotenv > .env.local
# lancer l'outil
rm .env.local
```

## Deploiement Cloudflare

### Option A: Sync Infisical vers Cloudflare Workers

Chemin recommande pour les secrets runtime: Infisical synchronise uniquement les secrets necessaires vers les Workers Cloudflare. Le code les lit via les bindings `env`.

### Option B: Injection au deploy

```bash
infisical run --env=staging -- pnpm deploy:staging
infisical run --env=prod -- pnpm deploy:prod
```

Pattern Alchemy:

```ts
const stage = process.env.STAGE ?? "dev";

export const server = await Worker("server", {
  name: `my-app-server-${stage}`,
  bindings: {
    BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET!),
    BETTER_AUTH_URL:
      stage === "prod" ? "https://api.example.com" : "https://api.staging.example.com",
  },
});
```

## Scripts recommandes

```json
{
  "scripts": {
    "predeploy": "pnpm fmt && pnpm lint && pnpm typecheck && pnpm doctor:react:diff",
    "deploy": "pnpm predeploy && pnpm exec alchemy deploy",
    "deploy:staging": "STAGE=staging pnpm deploy",
    "deploy:prod": "STAGE=prod pnpm deploy",
    "deploy:staging:secrets": "infisical run --env=staging -- pnpm deploy:staging",
    "deploy:prod:secrets": "infisical run --env=prod -- pnpm deploy:prod"
  }
}
```

## Validation runtime Worker

Valider les bindings Cloudflare, pas seulement `process.env`:

```ts
import { z } from "zod";

export const envSchema = z.object({
  DB: z.custom<D1Database>(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;
```

## Patterns inspires de CAPM

- Un seul `STAGE`: `dev`, `staging`, `prod`.
- Noms de ressources derives du stage.
- Domaines staging/prod explicites dans `alchemy.run.ts`.
- D1/R2/KV/Queues isoles par stage.
- Email reel desactive en staging.
- Backups obligatoires avant migrations D1 prod, suppressions R2, ou changements DNS.
- Production avec validation humaine, meme si preview/staging sont autonomes.

## Checklist

- [ ] Projet Infisical avec `dev`, `staging`, `prod`.
- [ ] `infisical.json` committe, aucun dotenv committe.
- [ ] `.env.local`, `.dev.vars`, backups dans `.gitignore`.
- [ ] Validation Zod des bindings Cloudflare et env de deploy.
- [ ] Choix clair: Workers Sync ou injection au deploy.
- [ ] Scripts `deploy:*:secrets` ajoutes.
- [ ] Migrations D1 testees sur staging avant production.
