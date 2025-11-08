# ADR-003: Drizzle ORM over Prisma

**Status:** Accepted

**Date:** October 2025

**Deciders:** Fenod Technical Team

---

## Context

We needed a database ORM/query builder that provides:

- Type-safe database queries
- Schema definition and migrations
- Edge runtime compatibility (Cloudflare Workers)
- Excellent TypeScript support
- Minimal runtime overhead
- SQL-like query syntax for transparency

### Considered Alternatives

1. **Prisma** - Industry standard ORM
2. **Drizzle** - TypeScript-first, edge-optimized
3. **Kysely** - Type-safe SQL query builder
4. **TypeORM** - Mature, decorator-based ORM

---

## Decision

We chose **Drizzle ORM** as our database toolkit.

---

## Rationale

### 1. **Edge Runtime Compatibility**

Drizzle works flawlessly on Cloudflare Workers:

- No Node.js dependencies
- Works with D1 (Cloudflare's SQLite)
- Small bundle size (~20KB)
- No binary dependencies

Prisma requires Node.js and doesn't officially support Cloudflare D1. While Prisma Data Proxy exists, it adds latency and cost.

### 2. **Type Inference vs Code Generation**

Drizzle uses TypeScript's type inference:

```tsx
// Define schema
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
})

// Types are inferred automatically
export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
```

Prisma requires code generation:

```prisma
// schema.prisma
model Customer {
  id    Int    @id @default(autoincrement())
  name  String
  email String
}
```

```bash
# Must run generator after every schema change
npx prisma generate
```

Drizzle's approach means:
- ✅ No build step needed
- ✅ Faster development iteration
- ✅ Types always in sync with schema
- ✅ Smaller codebase

### 3. **SQL-Like Queries**

Drizzle queries look like SQL, making them familiar and transparent:

```tsx
// Drizzle - looks like SQL
const result = await db.select()
  .from(customers)
  .where(eq(customers.email, 'test@example.com'))
  .limit(10)

// Prisma - custom API
const result = await prisma.customer.findMany({
  where: { email: 'test@example.com' },
  take: 10
})
```

Benefits:
- Easier to understand what SQL is being generated
- Easier to optimize queries
- Familiar to developers who know SQL
- Easier to debug

### 4. **Bundle Size**

| ORM | Bundle Size | Runtime | Notes |
|-----|-------------|---------|-------|
| Drizzle | ~20KB | Any | No runtime dependencies |
| Prisma | ~1MB+ | Node.js | Requires Prisma Client |
| Kysely | ~15KB | Any | Query builder only |
| TypeORM | ~500KB | Node.js | Many dependencies |

For edge deployments, smaller is better. Drizzle's minimal footprint is ideal.

### 5. **Schema Definition in TypeScript**

Drizzle schemas are TypeScript code:

```tsx
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
}))
```

Benefits:
- IDE autocompletion for schema definitions
- Type checking on schema itself
- Can use TypeScript utilities (enums, const arrays, etc.)
- No separate schema language to learn

Prisma uses a custom DSL (Prisma Schema Language) which:
- Requires learning new syntax
- No IDE support beyond Prisma extensions
- Harder to programmatically generate schemas

### 6. **Migrations**

Drizzle Kit generates SQL migrations from schema:

```bash
# Generate migration
npx drizzle-kit generate

# Creates:
# db/migrations/0001_fancy_name.sql
```

```sql
-- Generated SQL (human-readable and editable)
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);

CREATE INDEX email_idx ON customers(email);
```

Benefits:
- ✅ Human-readable SQL
- ✅ Can manually edit migrations
- ✅ Review migrations in git diffs
- ✅ No magic, full transparency

Prisma generates abstract migration files that are harder to understand and modify.

### 7. **Drizzle Studio**

Drizzle includes a visual database browser:

```bash
npx drizzle-kit studio
```

- View and edit data
- Browse schema
- Run queries
- All in the browser

While Prisma Studio is excellent, it requires a separate process and doesn't work well with edge databases like D1.

---

## Consequences

### Positive

✅ **Edge Compatible**: Works perfectly on Cloudflare Workers

✅ **Type Safety**: Excellent type inference without code generation

✅ **Performance**: Minimal bundle size, fast query execution

✅ **Transparency**: SQL-like queries, readable migrations

✅ **Developer Experience**: Fast iteration, no build step

✅ **Flexibility**: Can write raw SQL when needed

✅ **Multiple Databases**: Supports PostgreSQL, MySQL, SQLite

### Negative

❌ **Ecosystem**: Smaller than Prisma's

❌ **Tooling**: Less third-party integrations

❌ **Learning Curve**: Query API is different from Prisma

❌ **Community**: Smaller community, fewer examples

❌ **Features**: Some Prisma features not yet in Drizzle (full-text search helpers, etc.)

### Mitigations

1. **Ecosystem**: Core functionality is complete; Drizzle is production-ready
2. **Tooling**: Drizzle Studio provides essential database management
3. **Learning**: SQL knowledge transfers directly; query API is intuitive
4. **Community**: Growing rapidly; active Discord and GitHub
5. **Features**: Can use raw SQL for advanced features

---

## Comparison Table

| Feature | Drizzle | Prisma | Kysely | TypeORM |
|---------|---------|--------|--------|---------|
| Edge Runtime | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| Type Safety | ✅ Inferred | ✅ Generated | ✅ Inferred | ⚠️ Partial |
| Bundle Size | ✅ 20KB | ❌ 1MB+ | ✅ 15KB | ❌ 500KB |
| SQL Transparency | ✅ High | ⚠️ Medium | ✅ High | ⚠️ Low |
| Code Generation | ✅ No | ❌ Yes | ✅ No | ❌ Yes |
| Migrations | ✅ SQL files | ⚠️ Abstract | ❌ Manual | ⚠️ TypeScript |
| Studio/GUI | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Ecosystem | ⚠️ Growing | ✅ Large | ⚠️ Small | ✅ Mature |

---

## When Prisma Might Be Better

Consider Prisma if:

- You're deploying to Node.js servers (not edge)
- Your team has extensive Prisma experience
- You need specific Prisma ecosystem integrations (e.g., Prisma Pulse)
- You prefer code generation over type inference
- You need advanced features like database replication support

---

## When Kysely Might Be Better

Consider Kysely if:

- You want a pure query builder (no schema management)
- You have existing migrations setup
- You need absolute minimal bundle size
- You're comfortable managing schemas manually

---

## Implementation Examples

### Schema Definition

```tsx
// db/schema/customers.ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  status: text('status', { enum: ['active', 'inactive'] })
    .notNull()
    .default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
}))

// Type inference
export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert

// Zod schemas for validation
export const insertCustomerSchema = createInsertSchema(customers, {
  email: (schema) => schema.email.email(),
})

export const selectCustomerSchema = createSelectSchema(customers)
```

### Queries

```tsx
// List customers with pagination
const customers = await db.select()
  .from(customers)
  .limit(50)
  .offset(page * 50)

// Get single customer
const [customer] = await db.select()
  .from(customers)
  .where(eq(customers.id, id))
  .limit(1)

// Create customer
const [newCustomer] = await db.insert(customers)
  .values({ name: 'Acme Corp', email: 'contact@acme.com' })
  .returning()

// Update customer
const [updated] = await db.update(customers)
  .set({ name: 'New Name', updatedAt: new Date() })
  .where(eq(customers.id, id))
  .returning()

// Delete customer
await db.delete(customers)
  .where(eq(customers.id, id))

// Complex query with join
const customersWithOrders = await db.select({
  customer: customers,
  orderCount: count(orders.id),
})
  .from(customers)
  .leftJoin(orders, eq(orders.customerId, customers.id))
  .groupBy(customers.id)
```

### Transactions

```tsx
await db.transaction(async (tx) => {
  const [customer] = await tx.insert(customers)
    .values({ name: 'Acme', email: 'acme@example.com' })
    .returning()

  await tx.insert(orders)
    .values({ customerId: customer.id, total: 100 })
})
```

---

## Migration Path

### From Prisma

1. Convert Prisma schema to Drizzle schema
2. Generate initial Drizzle migration from existing database
3. Update queries to use Drizzle syntax
4. Remove Prisma Client and generators

Most concepts translate directly (models → tables, relations → joins).

---

## References

- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)
- [Cloudflare D1 with Drizzle](https://orm.drizzle.team/docs/get-started-cloudflare-d1)
- [Comparison: Drizzle vs Prisma](https://orm.drizzle.team/docs/compare)

---

**Last Updated:** November 2025
