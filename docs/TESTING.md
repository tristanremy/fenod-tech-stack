# Testing Guide

[:gb: English](./TESTING.md) | [:fr: Français](./fr/TESTING.md)

> Test slices in isolation, routes with integration tests, and user flows end-to-end.

## Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit & integration tests |
| **Playwright** | E2E browser tests |
| **MSW** | API mocking for frontend tests |

---

## Setup

### Install Dependencies

```bash
pnpm add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/dom jsdom
pnpm add -D playwright @playwright/test
pnpm add -D msw
```

### Vitest Configuration

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', '**/*.d.ts'],
    },
  },
})
```

### Test Setup File

```ts
// test/setup.ts
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## Unit Testing: Services

Services contain business logic and are the easiest to test.

### Structure

```
packages/api/src/routers/
├── order/
│   ├── router.ts
│   ├── service.ts
│   └── service.test.ts    # Unit tests here
```

### Example: Order Service Tests

```ts
// packages/api/src/routers/order/service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateTotal, validateStock, createOrder } from './service'

describe('orderService', () => {
  describe('calculateTotal', () => {
    it('sums item prices correctly', () => {
      const items = [
        { productId: 'p1', quantity: 2, price: 10 },
        { productId: 'p2', quantity: 1, price: 25 },
      ]
      expect(calculateTotal(items)).toBe(45)
    })

    it('returns 0 for empty array', () => {
      expect(calculateTotal([])).toBe(0)
    })

    it('handles decimal prices', () => {
      const items = [{ productId: 'p1', quantity: 3, price: 9.99 }]
      expect(calculateTotal(items)).toBeCloseTo(29.97)
    })
  })

  describe('validateStock', () => {
    it('throws when quantity exceeds stock', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ stock: 5 }]),
      }

      await expect(
        validateStock(mockDb as any, 'p1', 10)
      ).rejects.toThrow('Insufficient stock')
    })

    it('passes when stock is sufficient', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ stock: 20 }]),
      }

      await expect(
        validateStock(mockDb as any, 'p1', 10)
      ).resolves.not.toThrow()
    })
  })
})
```

### Testing with Database Mocks

```ts
// test/mocks/db.ts
import { vi } from 'vitest'

export function createMockDb() {
  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }
}

// Usage in tests
import { createMockDb } from '@/test/mocks/db'

const db = createMockDb()
db.returning.mockResolvedValue([{ id: 1, name: 'Test' }])
```

---

## Integration Testing: Routers

Test the full request/response cycle through ORPC routers.

### Structure

```
packages/api/src/routers/
├── order/
│   ├── router.ts
│   ├── router.test.ts     # Integration tests here
│   └── service.ts
```

### Test Client Setup

```ts
// test/helpers/client.ts
import { createORPCClient } from '@orpc/client'
import { appRouter } from '@/api/router'
import type { AppRouter } from '@/api/router'

export function createTestClient(context: Partial<Context> = {}) {
  const defaultContext: Context = {
    db: createMockDb(),
    user: null,
    ...context,
  }

  return {
    client: createORPCClient<AppRouter>({
      // Direct router call for testing
      fetch: async (input) => {
        const result = await appRouter.call(input, defaultContext)
        return new Response(JSON.stringify(result))
      },
    }),
    context: defaultContext,
  }
}

export function createAuthedTestClient(user = { id: 1, email: 'test@test.com' }) {
  return createTestClient({ user })
}
```

### Example: Router Integration Tests

```ts
// packages/api/src/routers/order/router.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestClient, createAuthedTestClient } from '@/test/helpers/client'

describe('orderRouter', () => {
  describe('list', () => {
    it('requires authentication', async () => {
      const { client } = createTestClient()

      await expect(client.order.list.query({})).rejects.toThrow('UNAUTHORIZED')
    })

    it('returns user orders only', async () => {
      const { client, context } = createAuthedTestClient({ id: 1, email: 'test@test.com' })

      context.db.returning.mockResolvedValue([
        { id: 1, userId: 1, total: 100 },
        { id: 2, userId: 1, total: 200 },
      ])

      const orders = await client.order.list.query({})

      expect(orders).toHaveLength(2)
      expect(context.db.where).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1 })
      )
    })
  })

  describe('create', () => {
    it('validates input schema', async () => {
      const { client } = createAuthedTestClient()

      await expect(
        client.order.create.mutate({ items: [] })
      ).rejects.toThrow('VALIDATION')
    })

    it('creates order with valid input', async () => {
      const { client, context } = createAuthedTestClient()

      context.db.returning.mockResolvedValue([{ id: 1, total: 45 }])

      const order = await client.order.create.mutate({
        items: [
          { productId: 'p1', quantity: 2 },
          { productId: 'p2', quantity: 1 },
        ],
      })

      expect(order.id).toBe(1)
      expect(context.db.insert).toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('prevents deleting other users orders', async () => {
      const { client, context } = createAuthedTestClient({ id: 1, email: 'test@test.com' })

      context.db.returning.mockResolvedValue([{ id: 1, userId: 2 }]) // Different user

      await expect(
        client.order.delete.mutate({ id: 1 })
      ).rejects.toThrow('FORBIDDEN')
    })
  })
})
```

---

## Component Testing

Test React components with Testing Library.

### Example: Form Component Test

```tsx
// app/components/customer-form.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomerForm } from './customer-form'

describe('CustomerForm', () => {
  it('renders all fields', () => {
    render(<CustomerForm onSubmit={vi.fn()} />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<CustomerForm onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<CustomerForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'invalid-email')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument()
  })

  it('calls onSubmit with form data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<CustomerForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/name/i), 'Acme Corp')
    await user.type(screen.getByLabelText(/email/i), 'contact@acme.com')
    await user.type(screen.getByLabelText(/phone/i), '+1234567890')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Acme Corp',
        email: 'contact@acme.com',
        phone: '+1234567890',
      })
    })
  })
})
```

### Testing with React Query

```tsx
// test/helpers/wrapper.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

// Usage
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper } from '@/test/helpers/wrapper'
import { useCustomers } from './use-customers'

it('fetches customers', async () => {
  const { result } = renderHook(() => useCustomers(), {
    wrapper: createWrapper(),
  })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toHaveLength(3)
})
```

---

## MSW: API Mocking

Mock API responses for frontend tests without hitting real servers.

### Setup MSW

```ts
// test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/orpc/customers.list', () => {
    return HttpResponse.json([
      { id: 1, name: 'Acme Corp', email: 'acme@test.com' },
      { id: 2, name: 'Globex', email: 'globex@test.com' },
    ])
  }),

  http.post('/api/orpc/customers.create', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 3, ...body })
  }),

  http.delete('/api/orpc/customers.delete', () => {
    return HttpResponse.json({ success: true })
  }),
]

// Error scenarios
export const errorHandlers = [
  http.get('/api/orpc/customers.list', () => {
    return HttpResponse.json(
      { code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' },
      { status: 500 }
    )
  }),
]
```

```ts
// test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

### Override Handlers in Tests

```tsx
import { server } from '@/test/mocks/server'
import { errorHandlers } from '@/test/mocks/handlers'

it('shows error state on API failure', async () => {
  server.use(...errorHandlers)

  render(<CustomerList />)

  expect(await screen.findByText(/failed to load/i)).toBeInTheDocument()
})
```

---

## E2E Testing: Playwright

Test complete user flows in real browsers.

### Playwright Configuration

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Page Object Pattern

```ts
// e2e/pages/customers.page.ts
import { Page, Locator } from '@playwright/test'

export class CustomersPage {
  readonly page: Page
  readonly heading: Locator
  readonly searchInput: Locator
  readonly addButton: Locator
  readonly table: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /customers/i })
    this.searchInput = page.getByPlaceholder(/search/i)
    this.addButton = page.getByRole('button', { name: /add customer/i })
    this.table = page.getByRole('table')
  }

  async goto() {
    await this.page.goto('/customers')
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    await this.page.waitForTimeout(300) // debounce
  }

  async clickAddCustomer() {
    await this.addButton.click()
  }

  async getRowByName(name: string) {
    return this.table.getByRole('row').filter({ hasText: name })
  }
}
```

### Example E2E Tests

```ts
// e2e/customers.spec.ts
import { test, expect } from '@playwright/test'
import { CustomersPage } from './pages/customers.page'

test.describe('Customers', () => {
  test('displays customer list', async ({ page }) => {
    const customersPage = new CustomersPage(page)
    await customersPage.goto()

    await expect(customersPage.heading).toBeVisible()
    await expect(customersPage.table).toBeVisible()
  })

  test('filters customers by search', async ({ page }) => {
    const customersPage = new CustomersPage(page)
    await customersPage.goto()

    await customersPage.search('Acme')

    const acmeRow = await customersPage.getRowByName('Acme')
    await expect(acmeRow).toBeVisible()
  })

  test('creates new customer', async ({ page }) => {
    const customersPage = new CustomersPage(page)
    await customersPage.goto()
    await customersPage.clickAddCustomer()

    await page.getByLabel(/name/i).fill('New Corp')
    await page.getByLabel(/email/i).fill('new@corp.com')
    await page.getByRole('button', { name: /create/i }).click()

    await expect(page).toHaveURL('/customers')
    await expect(page.getByText('New Corp')).toBeVisible()
  })
})
```

### Auth Fixtures

```ts
// e2e/fixtures/auth.ts
import { test as base, Page } from '@playwright/test'

type AuthFixtures = {
  authedPage: Page
}

export const test = base.extend<AuthFixtures>({
  authedPage: async ({ page }, use) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@test.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/dashboard')
    await use(page)
  },
})

// Usage
import { test } from './fixtures/auth'

test('authenticated user can access dashboard', async ({ authedPage }) => {
  await authedPage.goto('/dashboard')
  await expect(authedPage.getByRole('heading', { name: /dashboard/i })).toBeVisible()
})
```

---

## CI Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit:
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
      - run: pnpm test:run
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e:
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
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

---

## Test Organization Summary

```
project/
├── packages/api/src/routers/
│   └── {feature}/
│       ├── router.ts
│       ├── router.test.ts      # Integration tests
│       ├── service.ts
│       └── service.test.ts     # Unit tests
├── app/components/
│   ├── customer-form.tsx
│   └── customer-form.test.tsx  # Component tests
├── e2e/
│   ├── fixtures/
│   │   └── auth.ts
│   ├── pages/
│   │   └── customers.page.ts
│   └── customers.spec.ts       # E2E tests
├── test/
│   ├── helpers/
│   │   ├── client.ts
│   │   └── wrapper.tsx
│   ├── mocks/
│   │   ├── db.ts
│   │   ├── handlers.ts
│   │   └── server.ts
│   └── setup.ts
├── vitest.config.ts
└── playwright.config.ts
```

---

## Quick Reference

| Test Type | Tool | Location | Command |
|-----------|------|----------|---------|
| Unit (services) | Vitest | `*.test.ts` next to source | `pnpm test` |
| Integration (routers) | Vitest | `*.test.ts` next to source | `pnpm test` |
| Component | Vitest + RTL | `*.test.tsx` next to source | `pnpm test` |
| E2E | Playwright | `e2e/*.spec.ts` | `pnpm test:e2e` |
