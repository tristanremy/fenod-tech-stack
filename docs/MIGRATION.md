# Migration Guide

[Disponible en français](./fr/MIGRATION.md)

> From `create-better-t-stack` scaffold to production-ready Fenod patterns.

## Overview

`create-better-t-stack` gives you a working foundation. This guide transforms it into a production-ready codebase with:

- Slices architecture (feature-based organization)
- Type-safe error handling
- Environment validation
- Proper testing structure
- CI/CD pipeline

---

## Starting Point

After running `pnpm create better-t-stack@latest`, you have:

```
my-app/
├── apps/
│   └── web/                  # TanStack Start frontend
├── packages/
│   ├── api/                  # Hono + ORPC backend
│   └── db/                   # Drizzle schema
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Step 1: Add Shared Package

Create a shared package for types, utilities, and constants used across packages.

```bash
mkdir -p packages/shared/src
```

```json
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

```ts
// packages/shared/src/index.ts
export * from './errors';
export * from './env';
```

Update workspace references:

```json
// packages/api/package.json
{
  "dependencies": {
    "@my-app/shared": "workspace:*"
  }
}
```

```json
// apps/web/package.json
{
  "dependencies": {
    "@my-app/shared": "workspace:*"
  }
}
```

---

## Step 2: Add Error Handling

```ts
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

## Step 3: Add Environment Validation

```ts
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

Create `.env.example`:

```bash
# Copy .env.example from repo root
cp /path/to/fenod-tech-stack/.env.example .env.example
cp .env.example .env
```

---

## Step 4: Migrate to Slices Architecture

### Before (flat structure)

```
packages/api/src/
├── routers/
│   ├── users.ts
│   ├── posts.ts
│   └── index.ts
├── context.ts
└── index.ts
```

### After (slices)

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

### Migration Process

**1. Create slice directory:**

```bash
mkdir -p packages/api/src/routers/user
```

**2. Split router into router.ts and service.ts:**

```ts
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

```ts
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

```ts
// AFTER: packages/api/src/routers/user/router.ts
import { publicProcedure, protectedProcedure } from '../../orpc';
import { z } from 'zod';
import * as userService from './service';

export const userRouter = {
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => userService.getById(input.id)),

  update: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(({ input, ctx }) => userService.update(ctx.user.id, input)),
};
```

```ts
// AFTER: packages/api/src/routers/user/index.ts
export { userRouter } from './router';
export * as userService from './service';
```

**3. Update root router:**

```ts
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

## Step 5: Add Middleware

```ts
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

```ts
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

## Step 6: Add Global Error Handler

```ts
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

## Step 7: Setup Testing

```bash
pnpm add -D vitest @vitest/coverage-v8 @testing-library/react jsdom
```

```ts
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

Add test file next to service:

```ts
// packages/api/src/routers/user/service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getById } from './service';

describe('userService', () => {
  it('throws not found for missing user', async () => {
    await expect(getById('nonexistent')).rejects.toThrow('not found');
  });
});
```

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

---

## Step 8: Add TypeScript Strict Config

```json
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

## Step 9: Add CI Pipeline

```yaml
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

## Step 10: Final Structure

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

## Migration Checklist

### Phase 1: Foundation
- [ ] Create `packages/shared` package
- [ ] Add error handling utilities
- [ ] Add environment validation
- [ ] Create `.env.example`

### Phase 2: Architecture
- [ ] Migrate routers to slices pattern
- [ ] Separate router and service layers
- [ ] Add auth middleware
- [ ] Add ownership middleware
- [ ] Add global error handler

### Phase 3: Quality
- [ ] Enable strict TypeScript
- [ ] Add path aliases
- [ ] Setup Vitest
- [ ] Add initial tests
- [ ] Setup CI pipeline

### Phase 4: Production
- [ ] Configure deployment (see [DEPLOYMENT.md](./DEPLOYMENT.md))
- [ ] Add E2E tests (see [TESTING.md](./TESTING.md))
- [ ] Setup monitoring
- [ ] Deploy to staging
- [ ] Deploy to production

---

## Common Issues

### "Cannot find module @my-app/shared"

Run `pnpm install` after adding workspace dependencies.

### "Type error: user might be undefined"

Use `protectedProcedure` which guarantees `ctx.user` exists.

### "Circular dependency detected"

Services should not import from routers. Keep the dependency direction: `router → service → db`.

### "Tests can't resolve paths"

Add `vite-tsconfig-paths` plugin to vitest config.
