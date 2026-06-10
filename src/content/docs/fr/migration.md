---
title: "Migration"
verified: 2026-06
---

[Available in English](/fr/migration/)

> De l'échafaudage TanStack CLI aux modèles Fenod prêts pour la production.

## Aperçu

La CLI TanStack (`pnpm create @tanstack/start@latest`) vous donne une base de travail. Ce guide le transforme en une base de code prête pour la production avec :

- Architecture Slices (organisation basée sur les fonctionnalités)
- Gestion des erreurs de type sécurisé
- Validation de l'environnement
- Structure de test appropriée
- Pipeline CI/CD

---

## Point de départ

Après avoir exécuté le `pnpm create @tanstack/start@latest my-app --add-ons oRPC,drizzle,better-auth,shadcn,tanstack-query,cloudflare`, vous avez :

```
my-app/
├── app/                      # TanStack Start app
│   ├── routes/               # File-based routes
│   └── client.tsx            # Client entry
├── app.config.ts             # TanStack Start config
├── package.json
├── tsconfig.json
└── ...
```

---

## Étape 1 : Ajouter un package partagé

Créez un package partagé pour les types, les utilitaires et les constantes utilisés dans tous les packages.

```

bash
mkdir -p packages/shared/src
```

```

json
// packages/shared/package.json
{
  "name": "@my-app/shared",
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./errors": "./src/errors.ts",
    "./env": "./src/env.ts"
  }
}
```

```

ts
// packages/shared/src/index.ts
export * from './errors';
export * from './env';
```

Mettre à jour les références de l'espace de travail :

```

json
// packages/api/package.json
{
  "dependencies": {
    "@my-app/shared": "workspace:*"
  }
}
```

```

json
// apps/web/package.json
{
  "dependencies": {
    "@my-app/shared": "workspace:*"
  }
}
```

---

## Étape 2 : Ajouter la gestion des erreurs

```

ts
// packages/shared/src/errors.ts
import { ORPCError } from '@orpc/server';

export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AppError extends ORPCError {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(code, message);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export const Errors = {
  unauthorized: (message = 'Authentication required') =>
    new AppError(ErrorCode.UNAUTHORIZED, message),
  forbidden: (message = 'Access denied') =>
    new AppError(ErrorCode.FORBIDDEN, message),
  notFound: (resource: string) =>
    new AppError(ErrorCode.NOT_FOUND, `${resource} not found`),
  validation: (field: string, message: string) =>
    new AppError(ErrorCode.VALIDATION, message, { field }),
  conflict: (message: string) =>
    new AppError(ErrorCode.CONFLICT, message),
};
```

---

## Étape 3 : Ajouter la validation de l'environnement

```

ts
// packages/shared/src/env.ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  return result.data;
}
```

Créer `.env.example` :

```

bash
# Copy .env.example from repo root
cp /path/to/fenod-tech-stack/.env.example .env.example
cp .env.example .env
```

---

## Étape 4 : Migrer vers l'architecture Slices

### Avant (structure plate)

```
packages/api/src/
├── routers/
│   ├── users.ts
│   ├── posts.ts
│   └── index.ts
├── context.ts
└── index.ts
```

### Après (tranches)

```
packages/api/src/
├── routers/
│   ├── user/
│   │   ├── index.ts
│   │   ├── router.ts
│   │   └── service.ts
│   ├── post/
│   │   ├── index.ts
│   │   ├── router.ts
│   │   └── service.ts
│   └── index.ts
├── middleware/
│   ├── auth.ts
│   └── ownership.ts
├── context.ts
└── index.ts
```

### Processus de migration

**1. Créer un répertoire de tranches :**

```

bash
mkdir -p packages/api/src/routers/user
```

**2. Diviser le routeur en router.ts et service.ts :**

```

ts
// BEFORE: packages/api/src/routers/users.ts
import { o, publicProcedure, protectedProcedure } from '../orpc';
import { db } from '../db';
import { users } from '@my-app/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const userRouter = {
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [user] = await db.select().from(users).where(eq(users.id, input.id));
      if (!user) throw new Error('User not found');
      return user;
    }),

  update: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [user] = await db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id))
        .returning();
      return user;
    }),
};
```

```

ts
// AFTER: packages/api/src/routers/user/service.ts
import { db } from '../../db';
import { users } from '@my-app/db/schema';
import { eq } from 'drizzle-orm';
import { Errors } from '@my-app/shared/errors';

export async function getById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) throw Errors.notFound('User');
  return user;
}

export async function update(userId: string, data: { name?: string; email?: string }) {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  if (!user) throw Errors.notFound('User');
  return user;
}
```

```

ts
// AFTER: packages/api/src/routers/user/router.ts
import { publicProcedure, protectedProcedure } from '../../orpc';
import { z } from 'zod';
import * as userService from './service';

export const userRouter = {
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(({ input }) => userService.getById(input.id)),

  update: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .handler(({ input, context }) => userService.update(context.user.id, input)),
};
```

```

ts
// AFTER: packages/api/src/routers/user/index.ts
export { userRouter } from './router';
export * as userService from './service';
```

**3. Mettre à jour le routeur racine :**

```

ts
// packages/api/src/routers/index.ts
import { userRouter } from './user';
import { postRouter } from './post';

export const appRouter = {
  user: userRouter,
  post: postRouter,
};

export type AppRouter = typeof appRouter;
```

---

## Étape 5 : Ajouter un middleware

```

ts
// packages/api/src/middleware/auth.ts
import { o } from '../orpc';
import { Errors } from '@my-app/shared/errors';

export const authMiddleware = o.middleware(async ({ context, next }) => {
  if (!context.user) {
    throw Errors.unauthorized();
  }
  return next({
    context: {
      ...context,
      user: context.user, // Now guaranteed non-null
    },
  });
});

export const protectedProcedure = o.procedure.use(authMiddleware);
```

```

ts
// packages/api/src/middleware/ownership.ts
import { o } from '../orpc';
import { Errors } from '@my-app/shared/errors';

export function withOwnership<T extends { userId: string }>(
  getResource: (id: string) => Promise<T | undefined>
) {
  return o.middleware(async ({ context, input, next }) => {
    const resource = await getResource((input as { id: string }).id);

    if (!resource) {
      throw Errors.notFound('Resource');
    }

    if (resource.userId !== context.user!.id) {
      throw Errors.forbidden('You do not own this resource');
    }

    return next({
      context: { ...context, resource },
    });
  });
}
```

---

## Étape 6 : Ajouter un gestionnaire d'erreurs global

```

ts
// packages/api/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppError, ErrorCode } from '@my-app/shared/errors';
import { appRouter } from './routers';

const app = new Hono();

app.use('*', cors());

// Global error handler
app.onError((err, c) => {
  console.error(JSON.stringify({
    type: 'error',
    path: c.req.path,
    error: err.message,
    timestamp: new Date().toISOString(),
  }));

  if (err instanceof AppError) {
    return c.json(err.toJSON(), getHttpStatus(err.code));
  }

  return c.json({
    code: ErrorCode.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
  }, 500);
});

function getHttpStatus(code: string): number {
  const statusMap: Record<string, number> = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION: 400,
    CONFLICT: 409,
  };
  return statusMap[code] ?? 500;
}

export default app;
```

---

## Étape 7 : Test de configuration

```

bash
pnpm add -D vitest @vitest/coverage-v8 @testing-library/react jsdom
```

```

ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['**/*.test.{ts,tsx}'],
  },
});
```

Ajoutez le fichier de test à côté du service :

```

ts
// packages/api/src/routers/user/service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getById } from './service';

describe('userService', () => {
  it('throws not found for missing user', async () => {
    await expect(getById('nonexistent')).rejects.toThrow('not found');
  });
});
```

```

json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

---

## Étape 8 : Ajouter une configuration stricte TypeScript

```

json
// tsconfig.json (root)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@my-app/api/*": ["packages/api/src/*"],
      "@my-app/db/*": ["packages/db/src/*"],
      "@my-app/shared/*": ["packages/shared/src/*"]
    }
  }
}
```

---

## Étape 9 : Ajouter un pipeline CI

```

yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-test-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:run
      - run: pnpm build
```

---

## Étape 10 : Structure finale

```
my-app/
├── .github/
│   └── workflows/
│       └── ci.yml
├── apps/
│   └── web/
│       ├── src/
│       │   ├── components/
│       │   │   └── error-boundary.tsx
│       │   ├── lib/
│       │   │   └── api/
│       │   │       ├── client.ts
│       │   │       └── error-handler.ts
│       │   └── routes/
│       └── package.json
├── packages/
│   ├── api/
│   │   ├── src/
│   │   │   ├── routers/
│   │   │   │   ├── user/
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── router.ts
│   │   │   │   │   ├── service.ts
│   │   │   │   │   └── service.test.ts
│   │   │   │   └── index.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   └── ownership.ts
│   │   │   ├── context.ts
│   │   │   └── index.ts
│   │   └── package.json
│   ├── db/
│   │   ├── src/
│   │   │   └── schema/
│   │   ├── migrations/
│   │   └── package.json
│   └── shared/
│       ├── src/
│       │   ├── errors.ts
│       │   ├── env.ts
│       │   └── index.ts
│       └── package.json
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── turbo.json
└── vitest.config.ts
```

---

## Liste de contrôle de migration

### Phase 1 : Fondation
- [ ] Créer le package `packages/shared`
- [ ] Ajouter des utilitaires de gestion des erreurs
- [ ] Ajouter une validation d'environnement
- [ ] Créer `.env.example`

### Phase 2 : Architecture
- [ ] Migrer les routeurs vers le modèle de tranches
- [ ] Couches de routeur et de service séparées
- [ ] Ajouter un middleware d'authentification
- [ ] Ajouter un middleware de propriété
- [ ] Ajouter un gestionnaire d'erreurs global

### Phase 3 : Qualité
- [ ] Activer TypeScript strict
- [ ] Ajouter des alias de chemin
- [ ] Configuration Vitest
- [ ] Ajouter des tests initiaux
- [ ] Configurer le pipeline CI

### Phase 4 : Production
- [ ] Configurer le déploiement (voir [DEPLOYMENT.md](/fr/deployment/))
- [ ] Ajouter des tests E2E (voir [TESTING.md](/fr/testing/))
- [ ] Surveillance de la configuration
- [ ] Déployer sur staging
- [ ] Déployer en production

---

## Problèmes courants

### "Impossible de trouver le module @my-app/shared"

Exécutez `pnpm install` après avoir ajouté les dépendances de l'espace de travail.

### "Erreur de type : l'utilisateur n'est peut-être pas défini"

Utilisez `protectedProcedure` qui garantit que `ctx.user` existe.

### "Dépendance circulaire détectée"

Les services ne doivent pas être importés à partir de routeurs. Conserver le sens de dépendance : `router → service → db`.

### "Les tests ne peuvent pas résoudre les chemins"

Ajoutez le plugin `vite-tsconfig-paths` à la configuration vitest.
