# Troubleshooting Guide

Common issues and solutions when working with the Fenod Stack.

---

## Table of Contents

- [General Issues](#general-issues)
- [TanStack Start](#tanstack-start)
- [ORPC](#orpc)
- [Drizzle ORM](#drizzle-orm)
- [Cloudflare D1](#cloudflare-d1)
- [Better Auth](#better-auth)
- [Hono](#hono)
- [shadcn/ui](#shadcnui)
- [Build & Deployment](#build--deployment)
- [Performance](#performance)

---

## General Issues

### TypeScript errors after installing packages

**Problem:** TypeScript can't find types after `npm install`

**Solutions:**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache

# Rebuild TypeScript project references
npx tsc --build --force

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Module resolution errors

**Problem:** `Cannot find module '@/components/ui/button'`

**Solution:** Check your `tsconfig.json` has path aliases configured:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"],
      "@/components/*": ["./app/components/*"],
      "@/lib/*": ["./lib/*"]
    }
  }
}
```

### Environment variables not loading

**Problem:** `process.env.DATABASE_URL` is undefined

**Solutions:**

1. **Local development** - Create `.env.local`:
```bash
# .env.local
DATABASE_URL="..."
CLOUDFLARE_ACCOUNT_ID="..."
```

2. **Cloudflare Workers** - Use wrangler secrets:
```bash
# Set secret for remote
wrangler secret put DATABASE_URL

# For local development
echo "DATABASE_URL=xxx" >> .dev.vars
```

3. **Check Vite config** - Ensure env vars are exposed:
```ts
// vite.config.ts
export default defineConfig({
  define: {
    'process.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL)
  }
})
```

---

## TanStack Start

### Route not found / 404 errors

**Problem:** Routes return 404 even though file exists

**Checklist:**
1. File naming must match pattern: `app/routes/path/to/route.tsx`
2. Route file must export `Route` using `createFileRoute`:
```tsx
export const Route = createFileRoute('/customers/')({
  component: Customers,
})
```
3. Check for typos in file path vs. route path
4. Restart dev server after creating new routes

### Data not loading on initial SSR

**Problem:** Page loads without data, then flashes when client hydrates

**Solution:** Use route loaders to prefetch data:

```tsx
export const Route = createFileRoute('/customers/')({
  loader: async () => {
    return queryClient.ensureQueryData({
      queryKey: ['customers'],
      queryFn: () => api.customers.list.query()
    })
  },
  component: Customers,
})
```

### Navigation not working

**Problem:** `navigate()` or `<Link>` doesn't navigate

**Solutions:**

1. **Using navigate hook:**
```tsx
import { useNavigate } from '@tanstack/react-router'

function MyComponent() {
  const navigate = useNavigate()

  const handleClick = () => {
    // Correct way
    navigate({ to: '/customers' })

    // Not this
    // navigate('/customers') ❌
  }
}
```

2. **Using Link component:**
```tsx
import { Link } from '@tanstack/react-router'

// Correct
<Link to="/customers/$customerId" params={{ customerId: '123' }}>
  View Customer
</Link>

// For external links, use regular <a>
<a href="https://external.com">External</a>
```

---

## ORPC

### Type errors "Argument of type is not assignable"

**Problem:** ORPC client/server types don't match

**Solutions:**

1. **Ensure single source of truth for router:**
```tsx
// api/router.ts
export const appRouter = router({
  customers: {
    list: listCustomers,
    get: getCustomer,
  }
})

export type AppRouter = typeof appRouter
```

2. **Import AppRouter type in client:**
```tsx
// lib/api/client.ts
import type { AppRouter } from '@/api/router'

export const api = createORPCClient<AppRouter>({
  baseURL: '/api/orpc',
})
```

3. **Check for circular dependencies** - ORPC types can break with circular imports

### ORPC endpoint returns 404

**Problem:** Calling `api.customers.list.query()` returns 404

**Checklist:**

1. **Check Hono route is configured:**
```tsx
// api/index.ts
app.use('/api/orpc/*', createORPCHandler({
  router: appRouter,
  createContext: (c) => c.get('ctx'),
}))
```

2. **Verify base URL matches:**
```tsx
// Client base URL should match server route
createORPCClient<AppRouter>({
  baseURL: '/api/orpc',  // Must match Hono route
})
```

3. **Check network tab** - See actual URL being called

### Input validation fails silently

**Problem:** Invalid data passes through without error

**Solution:** Always define input schemas with Zod:

```tsx
import { z } from 'zod'

export const createCustomer = procedure
  .input(z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }))
  .mutation(async ({ input, ctx }) => {
    // input is validated and typed
  })
```

---

## Drizzle ORM

### Migrations not applying

**Problem:** `drizzle-kit generate` works but changes not in database

**Solutions:**

1. **Apply migration to correct environment:**
```bash
# Local D1
npx wrangler d1 execute my-db --local --file=./db/migrations/0001_xxx.sql

# Remote D1
npx wrangler d1 execute my-db --remote --file=./db/migrations/0001_xxx.sql

# PostgreSQL
npx drizzle-kit push
```

2. **Check migration file was generated:**
```bash
# Should see new file in
ls db/migrations/
```

3. **Verify wrangler.toml has correct database binding:**
```toml
[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "xxx"
```

### Type inference not working

**Problem:** `typeof users.$inferSelect` returns `any`

**Solutions:**

1. **Ensure you're using the schema object directly:**
```tsx
// ✅ Correct
export const users = sqliteTable('users', { ... })
export type User = typeof users.$inferSelect

// ❌ Wrong - don't use intermediate variable
const usersSchema = sqliteTable('users', { ... })
export const users = usersSchema
export type User = typeof users.$inferSelect
```

2. **Check TypeScript version** - Drizzle requires TS 5.0+

### Foreign key errors

**Problem:** `FOREIGN KEY constraint failed`

**Solutions:**

1. **Enable foreign keys in D1:**
```tsx
// api/context.ts
export function createContext(env: Env): Context {
  const db = drizzle(env.DB, { schema })

  // Enable foreign keys for each connection
  await env.DB.prepare('PRAGMA foreign_keys = ON').run()

  return { db }
}
```

2. **Ensure referenced row exists:**
```tsx
// Bad - customer doesn't exist
await db.insert(orders).values({
  customerId: 999, // ❌ No customer with ID 999
  total: 100
})

// Good - create customer first
const [customer] = await db.insert(customers).values({...}).returning()
await db.insert(orders).values({
  customerId: customer.id, // ✅ Customer exists
  total: 100
})
```

3. **Delete in correct order:**
```tsx
// Bad - can't delete customer with orders
await db.delete(customers).where(eq(customers.id, 1)) // ❌ Has orders

// Good - delete orders first
await db.delete(orders).where(eq(orders.customerId, 1))
await db.delete(customers).where(eq(customers.id, 1)) // ✅ No orders
```

### Query returns undefined

**Problem:** `.where(eq(...))` returns undefined instead of null

**Solution:** Drizzle returns array, use destructuring:

```tsx
// ❌ Wrong
const customer = await db.select()
  .from(customers)
  .where(eq(customers.id, 1))
// customer is Customer[] not Customer

// ✅ Correct
const [customer] = await db.select()
  .from(customers)
  .where(eq(customers.id, 1))
  .limit(1)
// customer is Customer | undefined
```

---

## Cloudflare D1

### Database not found in local development

**Problem:** `Error: D1_ERROR: no such database: DB`

**Solutions:**

1. **Create local database:**
```bash
npx wrangler d1 create my-db --local
```

2. **Check wrangler.toml binding name matches:**
```toml
[[d1_databases]]
binding = "DB"  # Must match env.DB in code
database_name = "my-db"
```

3. **Run migrations locally:**
```bash
npx wrangler d1 execute my-db --local --file=./db/migrations/0000_init.sql
```

### Cold start latency issues

**Problem:** First query after deployment takes 500ms+

**Solutions:**

1. **Use connection pooling** (automatic in D1)

2. **Warm up critical queries** in route loaders:
```tsx
export const Route = createFileRoute('/')({
  loader: async () => {
    // This runs on server, warming the connection
    await queryClient.ensureQueryData({
      queryKey: ['dashboard'],
      queryFn: () => api.dashboard.stats.query()
    })
  }
})
```

3. **Consider KV for frequently accessed data:**
```tsx
// Cache expensive queries in KV
const cached = await env.KV.get('dashboard:stats')
if (cached) return JSON.parse(cached)

const stats = await db.select().from(...)
await env.KV.put('dashboard:stats', JSON.stringify(stats), {
  expirationTtl: 300 // 5 minutes
})
```

### Query size limits

**Problem:** `Error: query too large`

**Solution:** D1 has query limits:
- Max query size: 1MB
- Max results: 10,000 rows
- Max parameters: 100

**Workarounds:**

1. **Paginate large result sets:**
```tsx
const customers = await db.select()
  .from(customers)
  .limit(100)
  .offset(page * 100)
```

2. **Batch large inserts:**
```tsx
// Split into chunks of 100
const chunks = chunkArray(data, 100)
for (const chunk of chunks) {
  await db.insert(users).values(chunk)
}
```

---

## Better Auth

### Session not persisting across requests

**Problem:** User has to login on every page

**Solutions:**

1. **Check cookie settings:**
```tsx
export const auth = betterAuth({
  // ...
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  advanced: {
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    }
  }
})
```

2. **Ensure you're awaiting getSession:**
```tsx
// ❌ Wrong
const session = auth.api.getSession({ headers: req.headers })

// ✅ Correct
const session = await auth.api.getSession({ headers: req.headers })
```

3. **Check CORS settings** if API is separate domain:
```tsx
app.use('*', cors({
  origin: 'https://your-frontend.com',
  credentials: true, // Important!
}))
```

### OAuth redirect not working

**Problem:** OAuth flow redirects to wrong URL

**Solution:** Set correct base URL:

```tsx
export const auth = betterAuth({
  // ...
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.BASE_URL}/api/auth/callback/google`,
    }
  }
})
```

Also update OAuth provider settings to allow redirect URI.

### Password hashing errors

**Problem:** `Error: Invalid password hash`

**Solution:** Better Auth handles hashing automatically, don't hash manually:

```tsx
// ❌ Wrong
await auth.api.signUp({
  email: 'user@example.com',
  password: await bcrypt.hash(password, 10), // Don't do this!
})

// ✅ Correct
await auth.api.signUp({
  email: 'user@example.com',
  password: 'plain-text-password', // Better Auth hashes it
})
```

---

## Hono

### Request body is undefined

**Problem:** `req.json()` or `req.body` is undefined

**Solutions:**

1. **Use correct method to parse body:**
```tsx
app.post('/api/users', async (c) => {
  // JSON body
  const body = await c.req.json()

  // Form data
  const formData = await c.req.formData()

  // Text
  const text = await c.req.text()
})
```

2. **Check Content-Type header:**
```tsx
// Client must send correct header
fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data)
})
```

### CORS errors in development

**Problem:** `Access-Control-Allow-Origin` error

**Solution:** Add CORS middleware:

```tsx
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}))
```

### Environment variables not available

**Problem:** `c.env.DATABASE_URL` is undefined

**Solutions:**

1. **Add to wrangler.toml:**
```toml
[vars]
DATABASE_URL = "..."
```

2. **Use secrets for sensitive data:**
```bash
echo "API_KEY=xxx" >> .dev.vars
```

3. **Type your environment:**
```tsx
type Env = {
  DB: D1Database
  API_KEY: string
}

const app = new Hono<{ Bindings: Env }>()
```

---

## shadcn/ui

### Components not styled correctly

**Problem:** shadcn components have no styling

**Solutions:**

1. **Verify Tailwind CSS is configured:**
```tsx
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

2. **Import global styles:**
```tsx
// app/root.tsx
import './styles/globals.css'
```

3. **Check utils.cn function exists:**
```tsx
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Dark mode not working

**Problem:** Dark mode toggle doesn't change theme

**Solution:** Install and configure next-themes:

```bash
npm install next-themes
```

```tsx
// app/providers.tsx
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

```tsx
// components/theme-toggle.tsx
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle theme
    </button>
  )
}
```

---

## Build & Deployment

### Build fails with "out of memory"

**Problem:** `JavaScript heap out of memory` during build

**Solutions:**

1. **Increase Node memory:**
```json
// package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
  }
}
```

2. **Check for circular dependencies:**
```bash
npx madge --circular --extensions ts,tsx ./app
```

3. **Reduce bundle size:**
```tsx
// Use dynamic imports for large components
const HeavyChart = lazy(() => import('./components/HeavyChart'))
```

### Deployment succeeds but site doesn't work

**Problem:** Site deploys but shows 500 errors in production

**Checklist:**

1. **Check Cloudflare Workers logs:**
```bash
wrangler tail
```

2. **Verify environment variables are set:**
```bash
wrangler secret list
```

3. **Test production build locally:**
```bash
wrangler dev --remote
```

4. **Check bindings in wrangler.toml match code:**
```toml
[[d1_databases]]
binding = "DB"  # Must match env.DB in code
```

### Asset paths broken after deployment

**Problem:** Images/fonts 404 in production

**Solution:** Use correct base path:

```tsx
// vite.config.ts
export default defineConfig({
  base: '/', // Or your subdirectory
})
```

```tsx
// Use public directory for static assets
// public/logo.png → /logo.png in production
<img src="/logo.png" alt="Logo" />
```

---

## Performance

### Page load is slow

**Problem:** Time to Interactive (TTI) > 3 seconds

**Solutions:**

1. **Enable SSR/SSG for initial load:**
```tsx
export const Route = createFileRoute('/')({
  loader: async () => {
    // Prefetch on server
    return queryClient.ensureQueryData(...)
  }
})
```

2. **Lazy load heavy components:**
```tsx
import { lazy, Suspense } from 'react'

const DataTable = lazy(() => import('./DataTable'))

function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <DataTable />
    </Suspense>
  )
}
```

3. **Optimize images:**
```tsx
// Use Cloudflare Images for automatic optimization
<img
  src="/cdn-cgi/image/width=800,quality=80/photo.jpg"
  alt="..."
/>
```

4. **Check bundle size:**
```bash
npx vite-bundle-visualizer
```

### Database queries are slow

**Problem:** API responses take >1 second

**Solutions:**

1. **Add database indexes:**
```tsx
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey(),
  email: text('email').notNull(),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
}))
```

2. **Use select only needed columns:**
```tsx
// ❌ Fetches everything
const users = await db.select().from(users)

// ✅ Fetches only needed columns
const users = await db.select({
  id: users.id,
  name: users.name,
}).from(users)
```

3. **Batch related queries:**
```tsx
// ❌ N+1 query problem
for (const customer of customers) {
  const orders = await db.select().from(orders)
    .where(eq(orders.customerId, customer.id))
}

// ✅ Single query with join
const customersWithOrders = await db.select()
  .from(customers)
  .leftJoin(orders, eq(orders.customerId, customers.id))
```

---

## Getting Help

If you're still stuck:

1. **Check official docs:**
   - [TanStack Start](https://tanstack.com/start)
   - [Hono](https://hono.dev)
   - [Drizzle](https://orm.drizzle.team)
   - [ORPC](https://orpc.unnoq.com)

2. **Community support:**
   - [TanStack Discord](https://discord.com/invite/tanstack)
   - [Cloudflare Discord](https://discord.cloudflare.com)

3. **GitHub Issues:**
   - Search existing issues first
   - Provide minimal reproduction

4. **Stack Overflow:**
   - Tag questions appropriately
   - Include code samples and error messages

---

**Last Updated:** November 2025
