# Development Strategy: UI-First Workflow

[Disponible en français](./fr/DEVELOPMENT-STRATEGY.md)

> **Philosophy**: Build and validate the entire user experience with dummy data before implementing backend logic. This approach allows for rapid iteration, early stakeholder feedback, and clear separation of concerns.

---

## 🎯 Why UI-First?

1. **Validate Ideas Fast** - See the full flow before investing in backend
2. **Stakeholder Approval** - Get design/UX sign-off early
3. **Clear Requirements** - Building UI reveals data structure needs
4. **Parallel Work** - Frontend and backend can be developed independently
5. **Reduces Rework** - Avoid building APIs for features that get cut

---

## 📋 Development Phases

```
Phase 1: UI Shell & Navigation (1-2 days)
   ↓
Phase 2: Component Library Setup (1 day)
   ↓
Phase 3: Page Layouts & Flows (2-3 days)
   ↓
Phase 4: Dummy Data & Interactions (1-2 days)
   ↓
Phase 5: Schema Design & Database (1 day)
   ↓
Phase 6: API Implementation (2-4 days)
   ↓
Phase 7: Connect Real Data (1 day)
   ↓
Phase 8: Auth & Permissions (1-2 days)
   ↓
Phase 9: Polish & Optimization (ongoing)
```

---

## Phase 1: UI Shell & Navigation

**Goal**: Create the application skeleton with working navigation between all pages.

### 1.1 Initialize Project

Use the official **[TanStack CLI](https://github.com/TanStack/cli)** to bootstrap your project:

```bash
pnpm create @tanstack/start@latest my-app
```

For the full fenod stack in one command:

```bash
pnpm create @tanstack/start@latest my-app \
  --add-ons oRPC,drizzle,better-auth,shadcn,tanstack-query,cloudflare
```

**Interactive selections (if not using --add-ons):**
- API: `oRPC`
- Auth: `Better Auth`
- ORM: `Drizzle` (select SQLite for D1)
- Deploy: `Cloudflare`
- UI: `shadcn`
- Additional: `TanStack Query`

Then add Hono and dev tooling:

```bash
cd my-app
pnpm add hono
pnpm add -D husky lint-staged
pnpm exec husky init
pnpm add -D lucide-react
```

### 1.2 Verify Tailwind CSS v4 Setup

> If you used the TanStack CLI with the `shadcn` add-on, Tailwind should already be configured. Verify and customize as needed.

```js
// vite.config.ts (should already exist)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* app/styles/globals.css */
@import "tailwindcss";

@theme {
  --font-family: 'Inter', system-ui, sans-serif;

  --color-primary: #3b82f6;
  --color-primary-foreground: #ffffff;
}
```

### 1.3 Create Navigation Structure

```tsx
// app/routes/__root.tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Navigation } from '../components/navigation'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto py-8">
        <Outlet />
      </main>
    </div>
  )
}
```

```tsx
// app/components/navigation.tsx
import { Link } from '@tanstack/react-router'
import { Home, Users, Settings, FileText } from 'lucide-react'

export function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-bold text-xl">
              MyApp
            </Link>
            <div className="flex gap-4">
              <NavLink to="/" icon={Home}>Dashboard</NavLink>
              <NavLink to="/customers" icon={Users}>Customers</NavLink>
              <NavLink to="/reports" icon={FileText}>Reports</NavLink>
              <NavLink to="/settings" icon={Settings}>Settings</NavLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, icon: Icon, children }: any) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
      activeProps={{ className: 'bg-gray-100 text-gray-900' }}
    >
      <Icon className="w-4 h-4" />
      {children}
    </Link>
  )
}
```

### 1.4 Create Empty Page Shells

```tsx
// app/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {/* Content will be added in Phase 3 */}
    </div>
  )
}
```

```tsx
// app/routes/customers/index.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/customers/')({
  component: Customers,
})

function Customers() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Customers</h1>
      {/* Content will be added in Phase 3 */}
    </div>
  )
}
```

**Checkpoint**: ✅ You can navigate between all pages

---

## Phase 2: Component Library Setup (shadcn)

**Goal**: Initialize shadcn/ui and install core components you'll need.

### 2.1 Initialize shadcn/ui

```bash
pnpm dlx shadcn@latest init

# Select options:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
```

### 2.2 Install Common Components

```bash
# Install components you'll likely need
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add label
pnpm dlx shadcn@latest add table
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add tabs
pnpm dlx shadcn@latest add skeleton
```

### 2.3 Setup TanStack AI Components (Optional)

```bash
# Install TanStack AI for chat, streaming, tools, and typed React state
pnpm add @tanstack/ai @tanstack/ai-react
pnpm add @tanstack/ai-anthropic # or your preferred provider adapter
```

```tsx
// lib/ai/config.ts
import { anthropicText } from '@tanstack/ai-anthropic'

export const chatModel = anthropicText('claude-3-5-sonnet-20241022')
```

### 2.4 Create Component Utilities

```tsx
// lib/utils/cn.ts (if not created by shadcn)
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Checkpoint**: ✅ shadcn components available, styles working

---

## Phase 3: Page Layouts & UI Flows

**Goal**: Build complete page layouts with all UI elements (using dummy data).

### 3.1 Dashboard with Stats

```tsx
// app/routes/index.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpRight, DollarSign, Users, ShoppingCart } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  // DUMMY DATA - Phase 4 will move this to proper data source
  const stats = [
    { title: 'Total Revenue', value: '$45,231', change: '+20.1%', icon: DollarSign },
    { title: 'Active Users', value: '2,345', change: '+12.5%', icon: Users },
    { title: 'Orders', value: '573', change: '+8.2%', icon: ShoppingCart },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button>Download Report</Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Activity feed will go here...</p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 3.2 List View with Table

```tsx
// app/routes/customers/index.tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, MoreVertical } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/customers/')({
  component: Customers,
})

function Customers() {
  // DUMMY DATA
  const customers = [
    { id: 1, name: 'Acme Corp', email: 'contact@acme.com', status: 'active', orders: 23 },
    { id: 2, name: 'Globex Inc', email: 'info@globex.com', status: 'active', orders: 15 },
    { id: 3, name: 'Initech', email: 'hello@initech.com', status: 'inactive', orders: 8 },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search customers..." className="pl-10" />
        </div>
        <Button variant="outline">Filters</Button>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  <Link
                    to="/customers/$customerId"
                    params={{ customerId: customer.id.toString() }}
                    className="hover:underline"
                  >
                    {customer.name}
                  </Link>
                </TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>
                  <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                    {customer.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{customer.orders}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
```

### 3.3 Detail View with Tabs

```tsx
// app/routes/customers/$customerId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit } from 'lucide-react'

export const Route = createFileRoute('/customers/$customerId')({
  component: CustomerDetail,
})

function CustomerDetail() {
  const { customerId } = Route.useParams()

  // DUMMY DATA
  const customer = {
    id: customerId,
    name: 'Acme Corp',
    email: 'contact@acme.com',
    phone: '+1 (555) 123-4567',
    status: 'active',
    since: 'Jan 2024',
  }

  return (
    <div>
      {/* Back Button */}
      <Button variant="ghost" className="mb-4" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Customers
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <Badge>{customer.status}</Badge>
          </div>
          <p className="text-gray-500">Customer since {customer.since}</p>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{customer.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{customer.phone}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">23</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Orders list will go here...</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Activity timeline will go here...</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Notes editor will go here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### 3.4 Form with Validation UI

```tsx
// app/routes/customers/new.tsx
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/customers/new')({
  component: NewCustomer,
})

function NewCustomer() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Phase 6 will add real form handling
    console.log('Form submitted')
  }

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" className="mb-4" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Customers
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Company Name *</Label>
                <Input id="name" placeholder="Acme Corp" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="contact@acme.com" required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="active">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit">
                Create Customer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Checkpoint**: ✅ All pages look complete with dummy data. Stakeholders can review flows.

---

## Phase 4: Dummy Data & Interactions

**Goal**: Extract dummy data to separate files and add interactive behaviors.

### 4.1 Create Mock Data Files

```tsx
// lib/mock-data/customers.ts
export type Customer = {
  id: number
  name: string
  email: string
  phone: string
  status: 'active' | 'inactive'
  since: string
  orders: number
}

export const mockCustomers: Customer[] = [
  {
    id: 1,
    name: 'Acme Corp',
    email: 'contact@acme.com',
    phone: '+1 (555) 123-4567',
    status: 'active',
    since: 'Jan 2024',
    orders: 23,
  },
  {
    id: 2,
    name: 'Globex Inc',
    email: 'info@globex.com',
    phone: '+1 (555) 234-5678',
    status: 'active',
    since: 'Feb 2024',
    orders: 15,
  },
  {
    id: 3,
    name: 'Initech',
    email: 'hello@initech.com',
    phone: '+1 (555) 345-6789',
    status: 'inactive',
    since: 'Dec 2023',
    orders: 8,
  },
]

export function getCustomerById(id: number): Customer | undefined {
  return mockCustomers.find(c => c.id === id)
}

export function getCustomers(): Customer[] {
  return mockCustomers
}
```

```tsx
// lib/mock-data/dashboard.ts
export type DashboardStats = {
  totalRevenue: { value: string; change: string }
  activeUsers: { value: string; change: string }
  orders: { value: string; change: string }
}

export function getDashboardStats(): DashboardStats {
  return {
    totalRevenue: { value: '$45,231', change: '+20.1%' },
    activeUsers: { value: '2,345', change: '+12.5%' },
    orders: { value: '573', change: '+8.2%' },
  }
}
```

### 4.2 Add Interactive Features

```tsx
// app/routes/customers/index.tsx (updated)
import { useState } from 'react'
import { getCustomers, type Customer } from '@/lib/mock-data/customers'

function Customers() {
  const [searchQuery, setSearchQuery] = useState('')
  const [customers, setCustomers] = useState<Customer[]>(getCustomers())

  // Simple client-side filtering
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      {/* ... */}
      <Input
        placeholder="Search customers..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />

      <Table>
        {/* ... */}
        <TableBody>
          {filteredCustomers.map((customer) => (
            // ...
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

### 4.3 Add Loading States

```tsx
// components/ui/loading-card.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function LoadingCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  )
}
```

### 4.4 Add Error States

```tsx
// components/ui/error-message.tsx
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function ErrorMessage({ title, message }: { title?: string; message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title || 'Error'}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
```

**Checkpoint**: ✅ App feels "real" with interactions, search works, forms respond

---

## Phase 5: Schema Design & Database

**Goal**: Design database schema based on UI requirements discovered in Phase 3-4.

### 5.1 Verify Drizzle Installation

> If you used the TanStack CLI with the `drizzle` add-on, these dependencies should already be installed. Verify your `package.json`.

```bash
# Only run if Drizzle is not already installed
pnpm add drizzle-orm
pnpm add -D drizzle-kit
pnpm add -D @cloudflare/workers-types
```

### 5.2 Create Schema from UI Needs

```tsx
// db/schema/customers.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Type inference
export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert

// Zod schemas for validation
export const insertCustomerSchema = createInsertSchema(customers, {
  email: z.string().email(),
  phone: z.string().optional(),
})

export const selectCustomerSchema = createSelectSchema(customers)
```

```tsx
// db/schema/orders.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  total: real('total').notNull(),
  status: text('status', {
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
  }).notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
```

### 5.3 Configure Drizzle

```tsx
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './db/schema/*.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
})
```

### 5.4 Generate & Run Migrations

```bash
# Generate migration from schema
pnpm drizzle-kit generate

# Apply migration to local D1
pnpm wrangler d1 execute fenod-db --local --file=./db/migrations/0000_initial.sql

# Apply migration to remote D1 (when ready)
pnpm wrangler d1 execute fenod-db --remote --file=./db/migrations/0000_initial.sql
```

**Checkpoint**: ✅ Database schema matches UI requirements

---

## Phase 6: API Implementation

**Goal**: Build type-safe APIs with Hono + ORPC + Drizzle.

### 6.1 Verify API Dependencies

> If you used the TanStack CLI with the `oRPC` add-on, these should already be installed and have basic structure scaffolded.

```bash
# Only run if not already installed
pnpm add hono @orpc/server @orpc/client
```

```ts
// packages/api/src/context.ts
import type { Context as HonoContext } from "hono";
import { auth } from "@my-app/auth";

export type CreateContextOptions = { context: HonoContext };

export async function createContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return { session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### 6.2 Create ORPC Procedures

```ts
// packages/api/src/routers/customer/router.ts
import z from "zod";
import { publicProcedure, protectedProcedure } from "../../index";
import { insertCustomerSchema } from "@my-app/db/schema/customers";
import * as customerService from "./service";

export const customerRouter = {
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .handler(async ({ input }) => {
      return await customerService.list(input);
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      return await customerService.getById(input.id);
    }),

  create: protectedProcedure
    .input(insertCustomerSchema)
    .handler(async ({ input, context }) => {
      return await customerService.create(input, context.session.user.id);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: insertCustomerSchema.partial(),
    }))
    .handler(async ({ input }) => {
      return await customerService.update(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      return await customerService.remove(input.id);
    }),
};
```

### 6.3 Create Router

```ts
// packages/api/src/routers/index.ts
import { publicProcedure } from "../index";
import { customerRouter } from "./customer/router";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  customers: customerRouter,
};
```

### 6.4 Setup Hono API Server

```ts
// apps/server/src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { RPCHandler } from "@orpc/server/fetch";
import { appRouter } from "@my-app/api/routers/index";
import { createContext } from "@my-app/api/context";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

const rpcHandler = new RPCHandler(appRouter);

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });
  const result = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context,
  });
  if (result.matched) return c.newResponse(result.response.body);
  await next();
});

export default app;
```

**Checkpoint**: ✅ API endpoints work, types are safe end-to-end

---

## Phase 7: Connect Real Data

**Goal**: Replace mock data with TanStack Query + ORPC calls.

### 7.1 Setup ORPC Client

```ts
// apps/web/src/utils/orpc.ts
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

const link = new RPCLink({
  url: "/rpc",
  fetch(url, options) {
    return fetch(url, { ...options, credentials: "include" });
  },
});

const client = createORPCClient(link);
export const orpc = createTanstackQueryUtils(client);
```

### 7.2 Setup TanStack Query

```bash
pnpm add @tanstack/react-query
```

```tsx
// app/routes/__root.tsx (updated)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto py-8">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  )
}
```

### 7.3 Replace Mock Data with Real Queries

```tsx
// app/routes/customers/index.tsx (updated)
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { LoadingCard } from "@/components/ui/loading-card";
import { ErrorMessage } from "@/components/ui/error-message";

function Customers() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: customers, isLoading, error } = useQuery(
    orpc.customers.list.queryOptions({ search: searchQuery })
  );

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Customers</h1>
        <div className="grid grid-cols-3 gap-6">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load customers" />;
  }

  return (
    <div>
      {/* Same UI as before, now with real data */}
      <Table>
        <TableBody>
          {customers?.map((customer) => (
            <TableRow key={customer.id}>
              {/* ... */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### 7.4 Add Mutations

```tsx
// app/routes/customers/new.tsx (updated)
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner"; // pnpm add sonner

function NewCustomer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    orpc.customers.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.customers.list.queryOptions({}).queryKey });
        toast.success("Customer created successfully");
        navigate({ to: "/customers" });
      },
      onError: () => {
        toast.error("Failed to create customer");
      },
    })
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createMutation.mutate({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      status: formData.get("status") as "active" | "inactive",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Same form UI */}
      <Button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Creating..." : "Create Customer"}
      </Button>
    </form>
  );
}
```

**Checkpoint**: ✅ All pages use real data from API

---

## Phase 8: Authentication & Permissions

**Goal**: Add Better Auth for user management.

### 8.1 Verify Better Auth Installation

> If you used the TanStack CLI with the `better-auth` add-on, it should already be installed with basic configuration. Review and customize as needed.

```bash
# Only run if Better Auth is not already installed
pnpm add better-auth
```

```ts
// lib/auth/config.ts
import { betterAuth } from 'better-auth'

export const auth = betterAuth({
  database: env.DB, // D1 binding — auto-detected in v1.5.0+
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
})
```

### 8.2 Add Auth to API Context

```ts
// packages/api/src/context.ts (updated with auth)
import type { Context as HonoContext } from "hono";
import { auth } from "@my-app/auth";

export async function createContext({ context }: { context: HonoContext }) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return { session };
}
```

### 8.3 Protected Routes

```ts
// packages/api/src/index.ts
import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";

export const o = os.$context<Context>();
export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({ context: { session: context.session } });
});

export const protectedProcedure = publicProcedure.use(requireAuth);
```

```ts
// packages/api/src/routers/customer/router.ts (updated)
import { protectedProcedure } from "../../index";
import { insertCustomerSchema } from "@my-app/db/schema/customers";

export const createCustomer = protectedProcedure
  .input(insertCustomerSchema)
  .handler(async ({ input, context }) => {
    return await customerService.create(input, context.session.user.id);
  });
```

### 8.4 Frontend Auth

```tsx
// lib/auth/client.ts
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: '/api/auth',
})

export const { useSession, signIn, signOut, signUp } = authClient
```

```tsx
// components/navigation.tsx (updated)
import { useSession, signOut } from '@/lib/auth/client'

export function Navigation() {
  const { data: session, isLoading } = useSession()

  return (
    <nav>
      {/* ... */}
      <div>
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">
                <Avatar>
                  <AvatarFallback>
                    {session.user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => signOut()}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => signIn()}>Sign In</Button>
        )}
      </div>
    </nav>
  )
}
```

**Checkpoint**: ✅ App has working authentication

---

## Phase 9: Polish & Optimization

**Goal**: Performance, UX polish, and production readiness.

### 9.1 Add Optimistic Updates

```tsx
// app/routes/customers/index.tsx (optimistic delete)
const listQueryKey = orpc.customers.list.queryOptions({}).queryKey;

const deleteMutation = useMutation(
  orpc.customers.delete.mutationOptions({
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: listQueryKey });
      const previousCustomers = queryClient.getQueryData(listQueryKey);
      queryClient.setQueryData(listQueryKey, (old: Customer[]) =>
        old.filter(c => c.id !== input.id)
      );
      return { previousCustomers };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(listQueryKey, context?.previousCustomers);
      toast.error("Failed to delete customer");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
  })
);
```

### 9.2 Add Prefetching

```tsx
// app/routes/customers/index.tsx (prefetch on hover)
import { useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

  function CustomerRow({ customer }: { customer: Customer }) {
  const queryClient = useQueryClient();

  const prefetchCustomer = () => {
    queryClient.prefetchQuery(
      orpc.customers.get.queryOptions({ id: customer.id })
    );
  };

  return (
    <TableRow onMouseEnter={prefetchCustomer}>
      {/* ... */}
    </TableRow>
  );
}
```

### 9.3 Add Suspense Boundaries

```tsx
// app/routes/customers/$customerId.tsx
import { Suspense } from "react";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/customers/$customerId")({
  component: CustomerDetail,
  loader: ({ params }) => {
    return queryClient.ensureQueryData(
      orpc.customers.get.queryOptions({ id: Number(params.customerId) })
    );
  },
});

function CustomerDetail() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <CustomerContent />
    </Suspense>
  );
}
```

### 9.4 Add Error Boundaries

```tsx
// components/error-boundary.tsx
import { Component, type ReactNode } from 'react'
import { ErrorMessage } from '@/components/ui/error-message'

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorMessage
          title="Something went wrong"
          message={this.state.error?.message || 'An unexpected error occurred'}
        />
      )
    }

    return this.props.children
  }
}
```

### 9.5 Performance Monitoring

```tsx
// lib/monitoring/performance.ts
export function reportWebVitals(metric: any) {
  // Send to analytics
  console.log(metric)

  // Example: Send to Cloudflare Analytics
  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    navigator.sendBeacon('/api/analytics', JSON.stringify(metric))
  }
}
```

```tsx
// app/routes/__root.tsx
import { useEffect } from 'react'
import { reportWebVitals } from '@/lib/monitoring/performance'

function RootLayout() {
  useEffect(() => {
    // Report web vitals
    if ('web-vitals' in window) {
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        onCLS(reportWebVitals)
        onFID(reportWebVitals)
        onFCP(reportWebVitals)
        onLCP(reportWebVitals)
        onTTFB(reportWebVitals)
      })
    }
  }, [])

  return (/* ... */)
}
```

**Checkpoint**: ✅ App is production-ready

---

## 🎨 MCP Integration for AI Features

### Setup AI-Powered Components

```bash
pnpm add @tanstack/ai @tanstack/ai-react @tanstack/ai-anthropic
```

```tsx
// lib/ai/chat-api.ts
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { anthropicText } from '@tanstack/ai-anthropic'

export async function POST(request: Request) {
  const { messages } = await request.json()

  const stream = chat({
    adapter: anthropicText('claude-3-5-sonnet-20241022'),
    messages,
  })

  return toServerSentEventsResponse(stream)
}
```

```tsx
// components/ai/customer-insights.tsx
import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function CustomerInsights({ customer }: { customer: Customer }) {
  const [input, setInput] = useState('')
  const { messages, sendMessage, isLoading } = useChat({
    connection: fetchServerSentEvents('/api/ai/chat'),
    initialMessages: [{
      role: 'system',
      parts: [{ type: 'text', content: `You are analyzing customer data for: ${JSON.stringify(customer)}` }],
    }],
  })

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">AI Insights</h3>

      <div className="space-y-4 mb-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'text-right' : ''}>
            <p className="text-sm">
              {m.parts.map((part, index) =>
                part.type === 'text' ? <span key={index}>{part.content}</span> : null
              )}
            </p>
          </div>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!input.trim() || isLoading) return
          sendMessage(input)
          setInput('')
        }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about this customer..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          Ask
        </Button>
      </form>
    </Card>
  )
}
```

---

## 📝 Development Checklist

Use this checklist to track your progress:

### Phase 1: UI Shell ☐
- [ ] Project initialized with TanStack Start
- [ ] Tailwind CSS v4 configured
- [ ] Navigation component created
- [ ] All page shells created
- [ ] Navigation between pages works

### Phase 2: Components ☐
- [ ] shadcn/ui initialized
- [ ] Core components installed (button, card, input, table, etc.)
- [ ] Component utilities configured (cn, etc.)
- [ ] MCP/TanStack AI installed (if needed)

### Phase 3: Page Layouts ☐
- [ ] Dashboard with stats cards
- [ ] List view with table
- [ ] Detail view with tabs
- [ ] Form pages with validation UI
- [ ] All pages look complete with dummy data

### Phase 4: Interactions ☐
- [ ] Mock data extracted to separate files
- [ ] Search/filter functionality works
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Forms respond to input

### Phase 5: Database ☐
- [ ] Drizzle ORM installed
- [ ] Schema designed based on UI needs
- [ ] Migrations generated
- [ ] Migrations applied to D1
- [ ] Types generated

### Phase 6: API ☐
- [ ] Hono + ORPC configured
- [ ] API context created
- [ ] All CRUD procedures implemented
- [ ] API routes tested
- [ ] Types are end-to-end safe

### Phase 7: Real Data ☐
- [ ] TanStack Query configured
- [ ] ORPC client setup
- [ ] All mock data replaced with queries
- [ ] Mutations implemented
- [ ] Loading/error states connected

### Phase 8: Auth ☐
- [ ] Better Auth configured
- [ ] Auth context added to API
- [ ] Protected routes implemented
- [ ] Frontend auth client setup
- [ ] Login/logout works

### Phase 9: Polish ☐
- [ ] Optimistic updates added
- [ ] Prefetching implemented
- [ ] Error boundaries added
- [ ] Performance monitoring setup
- [ ] Final testing complete

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured in Alchemy
- [ ] Database migrations applied to production
- [ ] API keys and secrets secured
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics configured

### Deployment
- [ ] Deploy to Cloudflare Workers via Alchemy
- [ ] Verify all routes work in production
- [ ] Test authentication flows
- [ ] Verify database connections
- [ ] Check API endpoints

### Post-deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify analytics data
- [ ] Test on multiple devices/browsers
- [ ] Set up uptime monitoring

---

## 💡 Tips & Best Practices

### 1. Keep UI and Data Separate
```tsx
// ✅ Good - Easy to swap data source
function CustomerList({ customers }: { customers: Customer[] }) {
  return <Table>...</Table>
}

// ❌ Bad - Hard to test, tightly coupled
function CustomerList() {
  const customers = useQuery(...)
  return <Table>...</Table>
}
```

### 2. Type Everything from the Start
```tsx
// ✅ Good - Types flow through entire app
export type Customer = typeof customers.$inferSelect

// ❌ Bad - Will cause problems later
const customer: any = { ... }
```

### 3. Design Database Last
- Build UI first reveals actual data relationships
- Avoid premature optimization of schema
- UI changes are cheaper than migration changes

### 4. Use Atomic Commits
```bash
git commit -m "feat: add customer list page UI"
git commit -m "feat: add customer detail page UI"
git commit -m "feat: connect customer list to API"
```

### 5. Progressive Enhancement
- Start with client-side filtering (Phase 4)
- Move to server-side when needed (Phase 6)
- Add caching/pagination later (Phase 9)

---

## 🔗 Next Steps

After completing this workflow:

1. **Testing** - Add unit tests with Vitest, E2E with Playwright
2. **Documentation** - Document API endpoints, component usage
3. **Monitoring** - Setup error tracking, performance monitoring
4. **CI/CD** - Automate testing and deployment
5. **Feature Flags** - Implement feature toggles for gradual rollouts

---

**Questions or stuck?** Reference the main [Fenod Stack README](../README.md) for technology documentation.
