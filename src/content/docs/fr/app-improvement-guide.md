---
title: "Guide d'Amélioration d'App"
verified: 2026-06
---

[Available in English](/fr/app-improvement-guide/)

> Guide de révision et de refactorisation de l'architecture pour les applications construites sur Fenod Stack.

## Contexte de la pile

- **Frontend :** Démarrage TanStack + Requête React + Formulaire TanStack
- **Backend :** Hono + ORPC (Architecture Slices)
- **Base de données :** Drizzle ORM + D1 (SQLite)
- **Auth :** Meilleure authentification
- **Infra :** Cloudflare (Workers, Pages, D1, R2, KV)

## Architecture : motif de tranches

###Structure

```
packages/api/src/routers/
├── {feature}/           # Feature slice
│   ├── index.ts         # Public exports
│   ├── router.ts        # ORPC endpoints
│   └── service.ts       # Business logic + DB
├── {feature}/
└── index.ts             # Root router
```

### Avantages des tranches

| Aspects | Amélioration |
|--------|-------------|
| **Maintenabilité** | Les modifications restent dans le dossier des fonctionnalités |
| **Découvertabilité** | Tous les codes de fonctionnalité au même endroit |
| **Tests** | Chaque tranche testable indépendamment |
| **Mise à l'échelle de l'équipe** | Les équipes peuvent posséder des fonctionnalités entières |

---

## Priorités d'amélioration

### 1. Performances

#### Base de données

- Ajouter des index sur les colonnes fréquemment interrogées (clés étrangères, filtres, tris)
- Utiliser `select()` avec des colonnes spécifiques au lieu de `select(*)`
- Opérations par lots avec `db.batch()` pour plusieurs écritures
- Utiliser des instructions préparées pour les requêtes répétées
- Implémenter une pagination basée sur le curseur sur le décalage

```

typescript
// service.ts - Cursor pagination
export async function listPaginated(cursor?: number, limit = 20) {
  const query = db.select().from(items).limit(limit).orderBy(items.id);

  if (cursor) {
    return await query.where(gt(items.id, cursor));
  }
  return await query;
}
```

#### API (Tranches)

- Gardez les routeurs minces - déléguez aux services
- Colocaliser la récupération des données dans les chargeurs d'itinéraire (éviter les cascades)
- Utiliser `Promise.all()` pour les requêtes indépendantes parallèles dans les services

```

typescript
// service.ts - Parallel queries
export async function getOrderWithDetails(orderId: string) {
  const [order, items, customer] = await Promise.all([
    getOrder(orderId),
    getOrderItems(orderId),
    getCustomer(orderId),
  ]);
  return { order, items, customer };
}
```

#### Front-end

- Itinéraires de chargement paresseux et composants lourds
- Utilisez `useSuspenseQuery` pour le streaming SSR
- Implémenter des mises à jour optimistes pour les mutations
- Virtualiser de longues listes (TanStack Virtual)

```

typescript
// Optimistic update pattern
const mutation = useMutation(
  orpc.todo.toggle.mutationOptions({
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData(["todos"]);
      queryClient.setQueryData(["todos"], (old) =>
        old.map((t) => (t.id === newTodo.id ? { ...t, ...newTodo } : t))
      );
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(["todos"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  })
);
```

### Mutations de vol unique (optimisation des performances)

Mutation des données + mise à jour de l'interface utilisateur en un seul aller-retour réseau. À utiliser lorsque les mutations affectent plusieurs éléments de l’interface utilisateur.

**Quand l'utiliser :**
- Liste des mises à jour des mutations + nombre + résumé (requêtes multiples)
- Tableaux de bord critiques pour les performances
- Utilisateurs mobiles/à connexion lente

**Quand ignorer :**
- CRUD simple avec une requête
- L'invalidation standard est assez rapide

```

typescript
// Server function: fetch updated data during mutation
const editTodo = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number(), text: z.string() }))
  .handler(async ({ input }) => {
    await db.update(todo).set({ text: input.text }).where(eq(todo.id, input.id));

    // Fetch all affected data in same request
    const [todos, count] = await Promise.all([
      db.select().from(todo),
      db.select({ count: sql`count(*)` }).from(todo),
    ]);

    return { todos, count };
  });

// Client: update cache directly, no refetch needed
const mutation = useMutation({
  mutationFn: editTodo,
  onSuccess: (data) => {
    queryClient.setQueryData(["todos"], data.todos);
    queryClient.setQueryData(["todos", "count"], data.count);
  },
});
```

**Référence :** [Plongée approfondie sur Frontend Masters](https://frontendmasters.com/blog/single-flight-mutations-in-tanstack-start-part-1/)

#### Cloudflare

- Cache à la périphérie avec Cache API pour les données publiques
- Utiliser KV pour la mise en cache de session/configuration (lourd en lecture)
- Utiliser des objets durables pour le temps réel/la coordination
- Tirer parti des `waitUntil()` pour un travail en arrière-plan non bloquant

```

typescript
// Background work pattern
export default {
  async fetch(request, env, ctx) {
    const response = await handleRequest(request);
    ctx.waitUntil(logAnalytics(request));
    return response;
  },
};
```

---

### 2. Sécurité

#### Authentification et sessions

- Activer `cookieCache` avec le cryptage JWE
- Définir `freshAge` pour les opérations sensibles (forcer la ré-authentification)
- Implémenter une limitation de débit sur les points de terminaison d'authentification
- Utilisez l'en-tête `cf-connecting-ip` pour une véritable IP

```

typescript
session: {
  expiresIn: 60 * 60 * 24 * 7,
  freshAge: 60 * 5,
  cookieCache: { enabled: true, maxAge: 300, strategy: "jwe" },
},
rateLimit: {
  storage: "database",
  customRules: {
    "/sign-in/email": { window: 60, max: 5 },
    "/sign-up/email": { window: 60, max: 3 },
  },
},
```

#### Validation des entrées (dans les routeurs)

- Valider TOUTES les entrées avec Zod au niveau du routeur
- Désinfecter le contenu utilisateur avant le stockage/l'affichage
- Drizzle gère les requêtes paramétrées par défaut

```

typescript
// router.ts - Validate at router level
export const orderRouter = {
  create: protectedProcedure
    .input(
      z.object({
        customerId: z.string().uuid(),
        items: z.array(
          z.object({
            productId: z.string().uuid(),
            quantity: z.number().int().positive().max(100),
          })
        ),
      })
    )
    .handler(async ({ input, context }) => {
      return await orderService.create(input, context.session.user.id);
    }),
};
```

#### Sécurité des API (dans les services)

- Vérifiez toujours la propriété des ressources dans les services
- Ne jamais exposer les erreurs internes aux clients
- Utilisez `env` du contexte Cloudflare, pas `process.env

```

`typescript
// service.ts - Ownership check
export async function getOrder(orderId: string, userId: string) {
  const order = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .get();

  if (!order) {
    throw new ORPCError("NOT_FOUND");
  }
  return order;
}
```

---

### 3. Qualité du code et modèles de tranches

#### Séparation routeur/service

```

typescript
// router.ts - Thin, validation + delegation
export const eventRouter = {
  create: protectedProcedure
    .input(createEventSchema)
    .handler(({ input, context }) =>
      eventService.create(input, context.session.user.id)
    ),
};

// service.ts - Business logic + DB
export async function create(data: CreateEventInput, userId: string) {
  return await db.insert(events).values({ ...data, createdBy: userId }).returning();
}
```

#### Middleware réutilisable

```

typescript
// packages/api/src/middleware/ownership.ts
export const withOwnership = (resourceType: string) =>
  o.middleware(async ({ context, input, next }) => {
    const resource = await getResource(resourceType, input.id);
    if (resource.userId !== context.session.user.id) {
      throw new ORPCError("FORBIDDEN");
    }
    return next({ context: { ...context, resource } });
  });

// Usage in router
export const postRouter = {
  update: protectedProcedure
    .use(withOwnership("post"))
    .input(updatePostSchema)
    .handler(({ context, input }) =>
      postService.update(context.resource, input)
    ),
};
```

#### Gestion des erreurs

##### Codes d'erreur standard

Définissez des codes d'erreur cohérents dans votre API :

```

typescript
// packages/shared/src/errors.ts
export const ErrorCode = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation
  VALIDATION: 'VALIDATION',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Business Logic
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
```

##### Classe d'erreur personnalisée

```

typescript
// packages/shared/src/errors.ts
import { ORPCError } from '@orpc/server';

export interface ErrorDetails {
  field?: string;
  expected?: unknown;
  received?: unknown;
  [key: string]: unknown;
}

export class AppError extends ORPCError {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: ErrorDetails
  ) {
    super(code, message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// Convenience constructors
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

  internal: (message = 'An unexpected error occurred') =>
    new AppError(ErrorCode.INTERNAL_ERROR, message),
};
```

##### Utilisation de la couche de service

```

typescript
// packages/api/src/routers/order/service.ts
import { Errors } from '@/shared/errors';

export async function purchase(productId: string, quantity: number, userId: string) {
  const product = await db.select().from(products).where(eq(products.id, productId)).get();

  if (!product) {
    throw Errors.notFound('Product');
  }

  if (product.stock < quantity) {
    throw new AppError(ErrorCode.INSUFFICIENT_STOCK, 'Not enough items in stock', {
      available: product.stock,
      requested: quantity,
    });
  }

  // Business logic continues...
}
```

##### Gestionnaire d'erreurs global (Hono)

```

typescript
// packages/api/src/index.ts
import { Hono } from 'hono';
import { AppError, ErrorCode } from '@/shared/errors';

const app = new Hono();

app.onError((err, c) => {
  // Log for debugging (appears in wrangler tail)
  console.error(JSON.stringify({
    type: 'error',
    path: c.req.path,
    method: c.req.method,
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  }));

  // Return AppError as-is
  if (err instanceof AppError) {
    const status = getHttpStatus(err.code);
    return c.json(err.toJSON(), status);
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return c.json({
      code: ErrorCode.VALIDATION,
      message: 'Validation failed',
      details: { errors: err.errors },
    }, 400);
  }

  // Never expose internal errors to client
  return c.json({
    code: ErrorCode.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
  }, 500);
});

function getHttpStatus(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.SESSION_EXPIRED:
      return 401;
    case ErrorCode.FORBIDDEN:
      return 403;
    case ErrorCode.NOT_FOUND:
      return 404;
    case ErrorCode.CONFLICT:
    case ErrorCode.ALREADY_EXISTS:
      return 409;
    case ErrorCode.VALIDATION:
    case ErrorCode.INVALID_INPUT:
      return 400;
    case ErrorCode.RATE_LIMITED:
      return 429;
    case ErrorCode.SERVICE_UNAVAILABLE:
      return 503;
    default:
      return 500;
  }
}
```

##### Gestion des erreurs côté client

```

typescript
// packages/web/src/lib/api/error-handler.ts
import { ErrorCode, type ErrorDetails } from '@/shared/errors';

export interface APIError {
  code: ErrorCode;
  message: string;
  details?: ErrorDetails;
}

export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

export function getErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export function isAuthError(error: unknown): boolean {
  return isAPIError(error) && (
    error.code === ErrorCode.UNAUTHORIZED ||
    error.code === ErrorCode.SESSION_EXPIRED
  );
}
```

##### Réagir à la limite d'erreur

```

tsx
// packages/web/src/components/error-boundary.tsx
import { Component, type ReactNode } from 'react';
import { isAuthError, getErrorMessage } from '@/lib/api/error-handler';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Log to error tracking service
    console.error('ErrorBoundary caught:', error);

    // Redirect to login on auth errors
    if (isAuthError(error)) {
      window.location.href = '/login';
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            {getErrorMessage(this.state.error)}
          </p>
          <Button onClick={this.handleReset}>Try again</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

##### Gestionnaire d'erreurs de requête

```

tsx
// packages/web/src/lib/api/query-client.ts
import { QueryClient } from '@tanstack/react-query';
import { isAuthError, isAPIError, ErrorCode } from '@/lib/api/error-handler';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (isAuthError(error)) return false;
        // Don't retry validation errors
        if (isAPIError(error) && error.code === ErrorCode.VALIDATION) return false;
        // Retry others up to 2 times
        return failureCount < 2;
      },
      staleTime: 60 * 1000,
    },
    mutations: {
      onError: (error) => {
        // Global error toast for mutations
        if (isAPIError(error)) {
          toast.error(error.message);
        } else {
          toast.error('An unexpected error occurred');
        }
      },
    },
  },
});
```

##### Utilisation dans les composants

```

tsx
// packages/web/src/routes/customers/index.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';
import { ErrorBoundary } from '@/components/error-boundary';
import { isAPIError, ErrorCode } from '@/lib/api/error-handler';
import { toast } from 'sonner';

function CustomerList() {
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery(orpc.customer.list.queryOptions({}));

  const deleteMutation = useMutation({
    ...orpc.customer.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.customer.list.queryOptions({}).queryKey });
      toast.success('Customer deleted');
    },
    onError: (error) => {
      // Handle specific error codes
      if (isAPIError(error)) {
        if (error.code === ErrorCode.FORBIDDEN) {
          toast.error('You do not have permission to delete this customer');
        } else if (error.code === ErrorCode.CONFLICT) {
          toast.error('Cannot delete customer with active orders');
        }
        // Other errors handled by global handler
      }
    },
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      {data?.map((customer) => (
        <CustomerRow
          key={customer.id}
          customer={customer}
          onDelete={() => deleteMutation.mutate(customer.id)}
        />
      ))}
    </div>
  );
}

// Wrap with error boundary
export default function CustomersPage() {
  return (
    <ErrorBoundary>
      <CustomerList />
    </ErrorBoundary>
  );
}
```

#### Bonnes pratiques dactylographiées

- Activer le mode strict partout
- Utilisez `satisfies` pour le rétrécissement du type
- Déduire les types à partir des schémas Drizzle
- Exporter les types de routeurs pour l'inférence client

```

typescript
// Infer from schema
type Event = typeof events.$inferSelect;
type NewEvent = typeof events.$inferInsert;

// Router type export (packages/api/src/index.ts)
export type AppRouter = typeof appRouter;
```

---

### 4. Test des tranches

Chaque tranche doit avoir ses propres tests :

```
routers/order/
├── router.ts
├── service.ts
├── router.test.ts    # API endpoint tests
└── service.test.ts   # Business logic tests
```

#### Tests de service (unitaires)

```

typescript
// service.test.ts
describe("orderService", () => {
  it("calculates total correctly", async () => {
    const items = [
      { productId: "p1", quantity: 2, price: 10 },
      { productId: "p2", quantity: 1, price: 25 },
    ];
    const total = orderService.calculateTotal(items);
    expect(total).toBe(45);
  });
});
```

#### Tests de routeur (intégration)

```

typescript
// router.test.ts
describe("orderRouter", () => {
  it("requires authentication", async () => {
    await expect(client.order.create({ items: [] }))
      .rejects.toThrow("UNAUTHORIZED");
  });

  it("validates input", async () => {
    const authedClient = await getAuthedClient();
    await expect(authedClient.order.create({ items: [] }))
      .rejects.toThrow("VALIDATION");
  });
});
```

---

### 5. Observabilité

- Ajouter une journalisation structurée avec des ID de demande
- Suivre les indicateurs clés (temps de réponse, taux d'erreur)
- Utilisez `console.log` avec JSON pour les journaux Cloudflare

```

typescript
// packages/shared/src/logger.ts
export const log = (level: string, message: string, data?: object) => {
  console.log(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...data,
    })
  );
};

// service.ts usage
export async function processOrder(orderId: string) {
  log("info", "Processing order", { orderId });
  try {
    // ...
    log("info", "Order processed", { orderId, duration: elapsed });
  } catch (error) {
    log("error", "Order processing failed", { orderId, error: error.message });
    throw error;
  }
}
```

---

## Liste de contrôle de révision

Lors de la révision du code, vérifiez :

### Performances
- [ ] Requêtes N+1 dans les services
- [ ] Index manquants sur les colonnes filtrées/triées
- [ ] Récupération de données en cascade dans les chargeurs
- [ ] Requêtes illimitées (LIMIT manquant)

### Sécurité
- [ ] Validation d'entrée manquante dans les routeurs
- [ ] Contrôles de propriété manquants dans les services
- [ ] Erreurs internes exposées
- [ ] Secrets/config codés en dur

### Architecture
- [ ] La logique métier s'infiltre dans les routeurs (devrait être dans les services)
- [ ] Imports cross-slice (les tranches doivent être indépendantes)
- [ ] Limites d'erreur manquantes sur le frontend
- [ ] Utilisation `any` non typée

###UX
- [ ] États de chargement/erreur manquants
- [ ] Mises à jour optimistes manquantes pour les mutations
- [ ] Limitation de débit manquante sur les terminaux sensibles

---

## Format de réponse

Lorsque vous suggérez des améliorations :

1. **Identifiez** le problème avec sa gravité (cercle rouge critique, cercle jaune modéré, cercle vert mineur)
2. **Expliquez** pourquoi c'est important (impact sur les performances/la sécurité/la maintenabilité)
3. **Afficher** le code avant/après
4. **Prioriser** par retour sur investissement (les gains rapides en premier)

Exemple :

```
RED CIRCLE **N+1 Query in orderService.listWithItems**

Current code makes 1 query per order to fetch items. With 100 orders = 101 queries.

Before (service.ts):
const orders = await db.select().from(orders);
for (const order of orders) {
  order.items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
}

After (service.ts):
const orders = await db.select()
  .from(orders)
  .leftJoin(orderItems, eq(orders.id, orderItems.orderId));

Impact: ~100x faster for large datasets
```

---

## Guide de migration des tranches

### De la structure plate aux tranches

```
# Before (flat)
routers/
├── events.ts
├── orders.ts
├── products.ts
└── index.ts

# After (slices)
routers/
├── event/
│   ├── index.ts
│   ├── router.ts
│   └── service.ts
├── order/
│   ├── index.ts
│   ├── router.ts
│   └── service.ts
└── index.ts
```

### Étapes

1. Créez un répertoire de fonctionnalités sous `routers/`
2. Extrayez les points de terminaison du routeur vers `router.ts`
3. Extraire la logique métier + les opérations DB vers `service.ts`
4. Créer des `index.ts` avec des exports publics
5. Mettre à jour les importations du routeur racine
6. Ajouter des tests au niveau des tranches
