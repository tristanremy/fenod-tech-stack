# App Improvement Guide

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

```typescript
// packages/shared/src/errors.ts
export class BusinessError extends ORPCError {
  constructor(code: string, message: string, public details?: unknown) {
    super(code, message);
  }
}

// service.ts usage
export async function purchase(productId: string, quantity: number) {
  const stock = await getStock(productId);
  if (stock < quantity) {
    throw new BusinessError("INSUFFICIENT_STOCK", "Not enough items", {
      available: stock,
      requested: quantity,
    });
  }
  // proceed...
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
