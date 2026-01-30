# Development Strategy: UI-First Workflow

[:gb: English](./DEVELOPMENT-STRATEGY.md) | [:fr: Français](./fr/DEVELOPMENT-STRATEGY.md)

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

Use **[create-better-t-stack](https://github.com/AmanVarshney01/create-better-t-stack)** to bootstrap your project with all the right dependencies:

```bash
# Using bun (recommended for speed)
bun create better-t-stack@latest my-app

# Or npm
npx create-better-t-stack@latest my-app

# Or pnpm
pnpm create better-t-stack@latest my-app
```

**Interactive selections:**
- Frontend: `React + TanStack Start`
- Backend: `Hono`
- API: `ORPC`
- Database: `SQLite` (for D1) or `PostgreSQL`
- ORM: `Drizzle`
- Auth: `Better Auth` (select Yes)
- Styling: `Tailwind CSS` (+ shadcn/ui will be added in Phase 2)
- Add-ons: `Ultracite` (for linting/formatting)

```bash
# Navigate to project
cd my-app

# Install additional dependencies for icons
npm install lucide-react
```

### 1.2 Verify Tailwind CSS v4 Setup

> **Note**: If you selected Tailwind CSS during `create-better-t-stack` setup, this should already be configured. Verify and customize as needed.

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
npx shadcn@latest init

# Select options:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
```

### 2.2 Install Common Components

```bash
# Install components you'll likely need
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add tabs
npx shadcn@latest add skeleton
```

### 2.3 Setup MCP for AI Components (Optional)

```bash
# Install AI SDK for enhanced components
npm install ai @ai-sdk/react
npm install @ai-sdk/anthropic  # or your preferred provider
```

```tsx
// lib/ai/config.ts
import { anthropic } from '@ai-sdk/anthropic'
import { createAI } from 'ai/rsc'

export const ai = createAI({
  model: anthropic('claude-3-5-sonnet-20241022'),
  // Configure based on your needs
})
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

> **Note**: If you selected Drizzle during `create-better-t-stack` setup, these dependencies should already be installed. Verify your `package.json`.

```bash
# Only run if Drizzle is not already installed
npm install drizzle-orm
npm install -D drizzle-kit
npm install @cloudflare/workers-types
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
npx drizzle-kit generate

# Apply migration to local D1
npx wrangler d1 execute fenod-db --local --file=./db/migrations/0000_initial.sql

# Apply migration to remote D1 (when ready)
npx wrangler d1 execute fenod-db --remote --file=./db/migrations/0000_initial.sql
```

**Checkpoint**: ✅ Database schema matches UI requirements

---

## Phase 6: API Implementation

**Goal**: Build type-safe APIs with Hono + ORPC + Drizzle.

### 6.1 Verify API Dependencies

> **Note**: If you selected Hono and ORPC during `create-better-t-stack` setup, these should already be installed and have basic structure scaffolded.

```bash
# Only run if not already installed
npm install hono @orpc/server @orpc/client
```

```tsx
// api/context.ts
import { drizzle } from 'drizzle-orm/d1'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '@/db/schema'

export type Context = {
  db: DrizzleD1Database<typeof schema>
  user?: { id: number; email: string }  // Will be populated in Phase 8
}

export function createContext(env: Env): Context {
  return {
    db: drizzle(env.DB, { schema }),
  }
}
```

### 6.2 Create ORPC Procedures

```tsx
// api/procedures/customers.ts
import { z } from 'zod'
import { procedure } from '@/api/trpc'
import { customers, insertCustomerSchema } from '@/db/schema/customers'
import { eq, like, or } from 'drizzle-orm'

// List customers with optional search
export const listCustomers = procedure
  .input(z.object({
    search: z.string().optional(),
    limit: z.number().default(50),
    offset: z.number().default(0),
  }))
  .query(async ({ input, ctx }) => {
    let query = ctx.db.select().from(customers)

    if (input.search) {
      query = query.where(
        or(
          like(customers.name, `%${input.search}%`),
          like(customers.email, `%${input.search}%`)
        )
      )
    }

    const results = await query
      .limit(input.limit)
      .offset(input.offset)

    return results
  })

// Get single customer
export const getCustomer = procedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input, ctx }) => {
    const [customer] = await ctx.db
      .select()
      .from(customers)
      .where(eq(customers.id, input.id))
      .limit(1)

    if (!customer) {
      throw new Error('Customer not found')
    }

    return customer
  })

// Create customer
export const createCustomer = procedure
  .input(insertCustomerSchema)
  .mutation(async ({ input, ctx }) => {
    const [customer] = await ctx.db
      .insert(customers)
      .values(input)
      .returning()

    return customer
  })

// Update customer
export const updateCustomer = procedure
  .input(z.object({
    id: z.number(),
    data: insertCustomerSchema.partial(),
  }))
  .mutation(async ({ input, ctx }) => {
    const [customer] = await ctx.db
      .update(customers)
      .set({ ...input.data, updatedAt: new Date() })
      .where(eq(customers.id, input.id))
      .returning()

    if (!customer) {
      throw new Error('Customer not found')
    }

    return customer
  })

// Delete customer
export const deleteCustomer = procedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input, ctx }) => {
    await ctx.db
      .delete(customers)
      .where(eq(customers.id, input.id))

    return { success: true }
  })
```

### 6.3 Create Router

```tsx
// api/router.ts
import { router } from '@/api/trpc'
import * as customerProcedures from './procedures/customers'

export const appRouter = router({
  customers: {
    list: customerProcedures.listCustomers,
    get: customerProcedures.getCustomer,
    create: customerProcedures.createCustomer,
    update: customerProcedures.updateCustomer,
    delete: customerProcedures.deleteCustomer,
  },
})

export type AppRouter = typeof appRouter
```

### 6.4 Setup Hono API Server

```tsx
// api/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createORPCHandler } from '@orpc/server/hono'
import { appRouter } from './router'
import { createContext } from './context'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.use('/api/*', async (c, next) => {
  const ctx = createContext(c.env)
  c.set('ctx', ctx)
  await next()
})

app.use('/api/orpc/*', createORPCHandler({
  router: appRouter,
  createContext: (c) => c.get('ctx'),
}))

export default app
```

**Checkpoint**: ✅ API endpoints work, types are safe end-to-end

---

## Phase 7: Connect Real Data

**Goal**: Replace mock data with TanStack Query + ORPC calls.

### 7.1 Setup ORPC Client

```tsx
// lib/api/client.ts
import { createORPCClient } from '@orpc/client'
import type { AppRouter } from '@/api/router'

export const api = createORPCClient<AppRouter>({
  baseURL: '/api/orpc',
})
```

### 7.2 Setup TanStack Query

```bash
npm install @tanstack/react-query
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
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { LoadingCard } from '@/components/ui/loading-card'
import { ErrorMessage } from '@/components/ui/error-message'

function Customers() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: () => api.customers.list.query({ search: searchQuery }),
  })

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
    )
  }

  if (error) {
    return <ErrorMessage message="Failed to load customers" />
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
  )
}
```

### 7.4 Add Mutations

```tsx
// app/routes/customers/new.tsx (updated)
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner' // npm install sonner

function NewCustomer() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: NewCustomer) => api.customers.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer created successfully')
      navigate({ to: '/customers' })
    },
    onError: (error) => {
      toast.error('Failed to create customer')
      console.error(error)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    createMutation.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      status: formData.get('status') as 'active' | 'inactive',
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Same form UI */}
      <Button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Creating...' : 'Create Customer'}
      </Button>
    </form>
  )
}
```

**Checkpoint**: ✅ All pages use real data from API

---

## Phase 8: Authentication & Permissions

**Goal**: Add Better Auth for user management.

### 8.1 Verify Better Auth Installation

> **Note**: If you selected Better Auth during `create-better-t-stack` setup, it should already be installed with basic configuration. Review and customize as needed.

```bash
# Only run if Better Auth is not already installed
npm install better-auth
```

```tsx
// lib/auth/config.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
  }),
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

```tsx
// api/context.ts (updated)
import { auth } from '@/lib/auth/config'

export async function createContext(req: Request, env: Env): Promise<Context> {
  const session = await auth.api.getSession({ headers: req.headers })

  return {
    db: drizzle(env.DB, { schema }),
    user: session?.user,
  }
}
```

### 8.3 Protected Routes

```tsx
// api/middleware/auth.ts
import { procedure } from '@/api/trpc'

export const protectedProcedure = procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Unauthorized')
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now guaranteed to exist
    },
  })
})
```

```tsx
// api/procedures/customers.ts (updated)
import { protectedProcedure } from '@/api/middleware/auth'

export const createCustomer = protectedProcedure
  .input(insertCustomerSchema)
  .mutation(async ({ input, ctx }) => {
    // ctx.user is now guaranteed to exist
    const [customer] = await ctx.db
      .insert(customers)
      .values({
        ...input,
        createdBy: ctx.user.id, // Track who created it
      })
      .returning()

    return customer
  })
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
const deleteMutation = useMutation({
  mutationFn: (id: number) => api.customers.delete.mutate({ id }),
  onMutate: async (id) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['customers'] })

    // Snapshot previous value
    const previousCustomers = queryClient.getQueryData(['customers'])

    // Optimistically update
    queryClient.setQueryData(['customers'], (old: Customer[]) =>
      old.filter(c => c.id !== id)
    )

    return { previousCustomers }
  },
  onError: (err, id, context) => {
    // Rollback on error
    queryClient.setQueryData(['customers'], context?.previousCustomers)
    toast.error('Failed to delete customer')
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] })
  },
})
```

### 9.2 Add Prefetching

```tsx
// app/routes/customers/index.tsx (prefetch on hover)
import { useQueryClient } from '@tanstack/react-query'

function CustomerRow({ customer }: { customer: Customer }) {
  const queryClient = useQueryClient()

  const prefetchCustomer = () => {
    queryClient.prefetchQuery({
      queryKey: ['customer', customer.id],
      queryFn: () => api.customers.get.query({ id: customer.id }),
    })
  }

  return (
    <TableRow onMouseEnter={prefetchCustomer}>
      {/* ... */}
    </TableRow>
  )
}
```

### 9.3 Add Suspense Boundaries

```tsx
// app/routes/customers/$customerId.tsx
import { Suspense } from 'react'

export const Route = createFileRoute('/customers/$customerId')({
  component: CustomerDetail,
  loader: ({ params }) => {
    // Prefetch data before component renders
    return queryClient.ensureQueryData({
      queryKey: ['customer', params.customerId],
      queryFn: () => api.customers.get.query({ id: Number(params.customerId) }),
    })
  },
})

function CustomerDetail() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <CustomerContent />
    </Suspense>
  )
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
npm install ai @ai-sdk/react @ai-sdk/anthropic
```

```tsx
// lib/ai/chat-api.ts
import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

export async function POST(request: Request) {
  const { messages } = await request.json()

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages,
  })

  return result.toDataStreamResponse()
}
```

```tsx
// components/ai/customer-insights.tsx
import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function CustomerInsights({ customer }: { customer: Customer }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat',
    initialMessages: [{
      role: 'system',
      content: `You are analyzing customer data for: ${JSON.stringify(customer)}`
    }],
  })

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">AI Insights</h3>

      <div className="space-y-4 mb-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'text-right' : ''}>
            <p className="text-sm">{m.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
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
- [ ] MCP/AI SDK installed (if needed)

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
