# App Improvement Guide

[:gb: English](./APP-IMPROVEMENT-GUIDE.md) | [:fr: Français](./fr/APP-IMPROVEMENT-GUIDE.md)

> Architecture review and refactoring guide for apps built on the Fenod Stack.

## Stack Context

- **Frontend:** TanStack Start + React Query + TanStack Form
- **Backend:** Hono + ORPC (Slices Architecture)
- **Database:** Drizzle ORM + D1 (SQLite)
- **Auth:** Better Auth
- **Infra:** Cloudflare (Workers, Pages, D1, R2, KV)

## Architecture: Slices Pattern

### Structure

```
packages/api/src/routers/
├── {feature}/           # Feature slice
│   ├── index.ts         # Public exports
│   ├── router.ts        # ORPC endpoints
│   └── service.ts       # Business logic + DB
├── {feature}/
└── index.ts             # Root router
```

### Slice Benefits

| Aspect | Improvement |
|--------|-------------|
| **Maintainability** | Changes stay within feature folder |
| **Discoverability** | All feature code in one place |
| **Testing** | Each slice testable independently |
| **Team scaling** | Teams can own entire features |

---

## Improvement Priorities

### 1. Performance

#### Database

- Add indexes on frequently queried columns (foreign keys, filters, sorts)
- Use `select()` with specific columns instead of `select(*)`
- Batch operations with `db.batch()` for multiple writes
- Use prepared statements for repeated queries
- Implement cursor-based pagination over offset

```typescript
// service.ts - Cursor pagination
export async function listPaginated(cursor?: number, limit = 20) {
  const query = db.select().from(items).limit(limit).orderBy(items.id);
  
  if (cursor) {
    return await query.where(gt(items.id, cursor));
  }
  return await query;
}
```

#### API (Slices)

- Keep routers thin - delegate to services
- Colocate data fetching in route loaders (avoid waterfalls)
- Use `Promise.all()` for parallel independent queries in services

```typescript
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

#### Frontend

- Lazy load routes and heavy components
- Use `useSuspenseQuery` for streaming SSR
- Implement optimistic updates for mutations
- Virtualize long lists (TanStack Virtual)

```typescript
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

### Single Flight Mutations (Performance Optimization)

Mutate data + update UI in one network roundtrip. Use when mutations affect multiple UI elements.

**When to use:**
- Mutation updates list + count + summary (multiple queries)
- Performance-critical dashboards
- Mobile/slow connection users

**When to skip:**
- Simple CRUD with one query
- Standard invalidation is fast enough

```typescript
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

**Reference:** [Frontend Masters deep dive](https://frontendmasters.com/blog/single-flight-mutations-in-tanstack-start-part-1/)

#### Cloudflare

- Cache at the edge with Cache API for public data
- Use KV for session/config caching (read-heavy)
- Use Durable Objects for real-time/coordination
- Leverage `waitUntil()` for non-blocking background work

```typescript
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

### 2. Security

#### Auth & Sessions

- Enable `cookieCache` with JWE encryption
- Set `freshAge` for sensitive operations (force re-auth)
- Implement rate limiting on auth endpoints
- Use `cf-connecting-ip` header for real IP

```typescript
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

#### Input Validation (in Routers)

- Validate ALL inputs with Zod at router level
- Sanitize user content before storage/display
- Drizzle handles parameterized queries by default

```typescript
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

#### API Security (in Services)

- Always check resource ownership in services
- Never expose internal errors to clients
- Use `env` from Cloudflare context, not `process.env`

```typescript
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

### 3. Code Quality & Slices Patterns

#### Router/Service Separation

```typescript
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

#### Reusable Middleware

```typescript
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

#### Error Handling

##### Standard Error Codes

Define consistent error codes across your API:

```typescript
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

##### Custom Error Class

```typescript
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

##### Service Layer Usage

```typescript
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

##### Global Error Handler (Hono)

```typescript
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

##### Client-Side Error Handling

```typescript
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

##### React Error Boundary

```tsx
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

##### Query Error Handler

```tsx
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

##### Usage in Components

```tsx
// packages/web/src/routes/customers/index.tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { isAPIError, ErrorCode } from '@/lib/api/error-handler';
import { toast } from 'sonner';

function CustomerList() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customer.list.query({}),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.customer.delete.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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

#### TypeScript Best Practices

- Enable strict mode everywhere
- Use `satisfies` for type narrowing
- Infer types from Drizzle schemas
- Export router types for client inference

```typescript
// Infer from schema
type Event = typeof events.$inferSelect;
type NewEvent = typeof events.$inferInsert;

// Router type export (packages/api/src/index.ts)
export type AppRouter = typeof appRouter;
```

---

### 4. Testing Slices

Each slice should have its own tests:

```
routers/order/
├── router.ts
├── service.ts
├── router.test.ts    # API endpoint tests
└── service.test.ts   # Business logic tests
```

#### Service Tests (Unit)

```typescript
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

#### Router Tests (Integration)

```typescript
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

### 5. Observability

- Add structured logging with request IDs
- Track key metrics (response times, error rates)
- Use `console.log` with JSON for Cloudflare logs

```typescript
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

## Review Checklist

When reviewing code, check for:

### Performance
- [ ] N+1 queries in services
- [ ] Missing indexes on filtered/sorted columns
- [ ] Waterfall data fetching in loaders
- [ ] Unbounded queries (missing LIMIT)

### Security
- [ ] Missing input validation in routers
- [ ] Missing ownership checks in services
- [ ] Exposed internal errors
- [ ] Hardcoded secrets/config

### Architecture
- [ ] Business logic leaking into routers (should be in services)
- [ ] Cross-slice imports (slices should be independent)
- [ ] Missing error boundaries on frontend
- [ ] Untyped `any` usage

### UX
- [ ] Missing loading/error states
- [ ] Missing optimistic updates for mutations
- [ ] Missing rate limiting on sensitive endpoints

---

## Response Format

When suggesting improvements:

1. **Identify** the issue with severity (red circle critical, yellow circle moderate, green circle minor)
2. **Explain** why it matters (perf/security/maintainability impact)
3. **Show** before/after code
4. **Prioritize** by ROI (quick wins first)

Example:
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

## Slices Migration Guide

### From Flat Structure to Slices

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

### Steps

1. Create feature directory under `routers/`
2. Extract router endpoints to `router.ts`
3. Extract business logic + DB operations to `service.ts`
4. Create `index.ts` with public exports
5. Update root router imports
6. Add slice-level tests
