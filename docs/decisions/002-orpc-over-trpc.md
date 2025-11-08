# ADR-002: ORPC over tRPC

**Status:** Accepted

**Date:** October 2025

**Deciders:** Fenod Technical Team

---

## Context

We needed a type-safe RPC layer to connect our React frontend with the Hono backend. The solution needed to provide:

- End-to-end type safety from database → API → client
- Minimal runtime overhead
- Great TypeScript inference
- Edge runtime compatibility
- Simple setup and maintenance

### Considered Alternatives

1. **tRPC** - Industry standard for type-safe RPC
2. **ORPC** - Newer, built specifically for Hono
3. **GraphQL** - Query language with type safety
4. **REST API** - Traditional HTTP endpoints

---

## Decision

We chose **ORPC** as our RPC layer for type-safe API communication.

---

## Rationale

### 1. **Simpler Architecture**

ORPC has a cleaner, more intuitive API than tRPC:

```tsx
// ORPC - straightforward procedure definition
export const getCustomer = procedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input, ctx }) => {
    return ctx.db.select()
      .from(customers)
      .where(eq(customers.id, input.id))
  })

// tRPC - more boilerplate
export const getCustomer = t.procedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input, ctx }) => {
    return ctx.db.select()
      .from(customers)
      .where(eq(customers.id, input.id))
  })
```

While similar, ORPC's router composition is more intuitive for Hono users.

### 2. **Built for Hono**

ORPC was designed specifically to integrate with Hono:

```tsx
// ORPC + Hono integration is first-class
import { createORPCHandler } from '@orpc/server/hono'

app.use('/api/orpc/*', createORPCHandler({
  router: appRouter,
  createContext: (c) => ({ db: c.get('db') })
}))
```

tRPC requires adapters and more configuration for Hono.

### 3. **Better Edge Runtime Support**

ORPC is optimized for edge runtimes:

- No Node.js dependencies
- Smaller bundle size
- Faster cold starts on Cloudflare Workers

tRPC was originally built for Node.js and has more dependencies.

### 4. **Simpler Type Inference**

ORPC's type inference is more straightforward:

```tsx
// Client automatically infers all types
const { data } = useQuery({
  queryKey: ['customer', id],
  queryFn: () => api.customers.get.query({ id })
})
// data is Customer | undefined - no manual typing needed
```

### 5. **Middleware System**

ORPC's middleware is cleaner:

```tsx
// Create protected procedure with middleware
const protectedProcedure = procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) throw new Error('Unauthorized')
  return next({ ctx: { ...ctx, user: ctx.user } })
})

export const deleteCustomer = protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input, ctx }) => {
    // ctx.user is guaranteed to exist here
  })
```

### 6. **Community and Momentum**

While tRPC has a larger community, ORPC is:

- Actively maintained
- Gaining adoption in the Hono ecosystem
- Simpler to contribute to (less complex codebase)
- Better documented for Cloudflare Workers use case

---

## Consequences

### Positive

✅ **Simplicity**: Less boilerplate, easier to understand

✅ **Type Safety**: Full end-to-end type safety with excellent inference

✅ **Performance**: Smaller bundles, faster execution on edge

✅ **Hono Integration**: First-class support for our chosen backend framework

✅ **Edge Optimized**: Built for Cloudflare Workers from day one

✅ **Middleware**: Clean, composable middleware system

### Negative

❌ **Smaller Community**: Fewer resources and examples than tRPC

❌ **Ecosystem**: Fewer third-party integrations

❌ **Hiring**: Developers more familiar with tRPC

❌ **Tooling**: Less developed than tRPC's ecosystem

### Mitigations

1. **Community**: ORPC concepts are similar to tRPC, easy to learn
2. **Ecosystem**: Core functionality is complete; most integrations are simple
3. **Hiring**: tRPC knowledge transfers easily; learning curve is minimal
4. **Tooling**: TypeScript provides most tooling benefits automatically

---

## Comparison Table

| Feature | ORPC | tRPC | GraphQL | REST |
|---------|------|------|---------|------|
| Type Safety | ✅ Excellent | ✅ Excellent | ⚠️ Requires codegen | ❌ Manual |
| Bundle Size | ✅ Small (~5KB) | ⚠️ Medium (~15KB) | ❌ Large (~50KB+) | ✅ Minimal |
| Edge Support | ✅ Excellent | ⚠️ Good | ⚠️ Varies | ✅ Excellent |
| Hono Integration | ✅ First-class | ⚠️ Adapter required | ⚠️ Adapter required | ✅ Native |
| Learning Curve | ✅ Simple | ⚠️ Moderate | ❌ Steep | ✅ Simple |
| Ecosystem | ⚠️ Growing | ✅ Large | ✅ Mature | ✅ Mature |
| Batching | ✅ Built-in | ✅ Built-in | ✅ Built-in | ❌ Manual |
| Subscriptions | ⚠️ Limited | ✅ Full support | ✅ Full support | ❌ Not native |

---

## When tRPC Might Be Better

Consider tRPC if:

- You need real-time subscriptions (WebSocket support)
- Your team has extensive tRPC experience
- You need specific tRPC ecosystem integrations
- You're using Next.js with their official adapter

---

## When GraphQL Might Be Better

Consider GraphQL if:

- You need complex, nested data requirements
- Multiple clients with different data needs
- You want field-level permissions
- You need mature tooling (GraphiQL, Apollo DevTools)

---

## When REST Might Be Better

Consider REST if:

- You need to support non-TypeScript clients
- Public API consumed by third parties
- Simple CRUD operations only
- Standard HTTP caching is critical

---

## Implementation Example

### Server Setup

```tsx
// api/procedures/customers.ts
import { procedure } from '@/api/trpc'
import { z } from 'zod'

export const list = procedure
  .input(z.object({
    limit: z.number().default(50),
    offset: z.number().default(0),
  }))
  .query(async ({ input, ctx }) => {
    return ctx.db.select()
      .from(customers)
      .limit(input.limit)
      .offset(input.offset)
  })

export const create = procedure
  .input(insertCustomerSchema)
  .mutation(async ({ input, ctx }) => {
    const [customer] = await ctx.db
      .insert(customers)
      .values(input)
      .returning()
    return customer
  })

// api/router.ts
import { router } from '@/api/trpc'
import * as customerProcedures from './procedures/customers'

export const appRouter = router({
  customers: {
    list: customerProcedures.list,
    create: customerProcedures.create,
  }
})

export type AppRouter = typeof appRouter
```

### Client Usage

```tsx
// app/routes/customers/index.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

function Customers() {
  const queryClient = useQueryClient()

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customers.list.query({ limit: 50 })
  })

  const createMutation = useMutation({
    mutationFn: (data: NewCustomer) => api.customers.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  // All fully typed!
}
```

---

## Migration Path

### From tRPC

1. Replace `t.procedure` with `procedure`
2. Update import paths
3. Replace tRPC client with ORPC client
4. Update Hono adapter

Most code remains identical due to similar APIs.

### From REST

1. Define procedures for each endpoint
2. Add Zod schemas for validation
3. Update client to use ORPC client
4. Remove manual type definitions

---

## References

- [ORPC Docs](https://orpc.unnoq.com)
- [tRPC Docs](https://trpc.io)
- [Comparison: ORPC vs tRPC](https://orpc.unnoq.com/docs/comparison)
- [Hono Integration](https://orpc.unnoq.com/docs/server/hono)

---

**Last Updated:** November 2025
