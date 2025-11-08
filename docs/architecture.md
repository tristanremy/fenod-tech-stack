# Fenod Stack Architecture

This document provides visual architecture diagrams and explanations of how the Fenod Stack components interact.

---

## Table of Contents

- [Full-Stack Data Flow](#full-stack-data-flow)
- [Cloudflare Edge Deployment](#cloudflare-edge-deployment)
- [Authentication Flow](#authentication-flow)
- [Monorepo Structure](#monorepo-structure)
- [Request Lifecycle](#request-lifecycle)
- [Database Layer](#database-layer)

---

## Full-Stack Data Flow

This diagram shows how data flows through a typical Fenod Stack application, from the user interface to the database and back.

```mermaid
graph TB
    subgraph "Browser"
        UI[React UI<br/>TanStack Start]
        TQ[TanStack Query<br/>Client Cache]
    end

    subgraph "Edge Runtime - Cloudflare Workers"
        Router[TanStack Router<br/>SSR/SSG]
        API[Hono API Server]
        ORPC[ORPC Layer<br/>Type-safe RPC]
        Auth[Better Auth<br/>Session Management]
    end

    subgraph "Data Layer"
        Drizzle[Drizzle ORM<br/>Type-safe Queries]
        D1[(Cloudflare D1<br/>SQLite)]
        R2[Cloudflare R2<br/>Object Storage]
    end

    UI -->|User Action| TQ
    TQ -->|API Call| ORPC
    ORPC -->|HTTP| API
    API -->|Check Auth| Auth
    API -->|Query/Mutation| Drizzle
    Drizzle -->|SQL| D1
    API -->|File Upload| R2

    D1 -->|Data| Drizzle
    Drizzle -->|Response| API
    API -->|JSON| ORPC
    ORPC -->|Typed Data| TQ
    TQ -->|Update UI| UI

    Router -.->|SSR/Prefetch| API

    style UI fill:#3b82f6,stroke:#1e40af,color:#fff
    style API fill:#10b981,stroke:#059669,color:#fff
    style D1 fill:#f59e0b,stroke:#d97706,color:#fff
```

**Key Points:**
- **Type Safety**: Types flow from database schema → Drizzle → ORPC → TanStack Query → React components
- **Edge Runtime**: Everything runs on Cloudflare's global network for low latency
- **Caching**: TanStack Query provides intelligent client-side caching
- **SSR Support**: TanStack Router can pre-fetch data on the server

---

## Cloudflare Edge Deployment

This diagram illustrates how applications are deployed across Cloudflare's global edge network.

```mermaid
graph TB
    subgraph "Developer"
        Code[Git Repository]
        CLI[Wrangler CLI / Alchemy]
    end

    subgraph "Cloudflare Global Network"
        subgraph "Edge Locations (300+)"
            Worker1[Worker Instance<br/>San Francisco]
            Worker2[Worker Instance<br/>London]
            Worker3[Worker Instance<br/>Singapore]
        end

        subgraph "Cloudflare Services"
            Pages[Cloudflare Pages<br/>Static Assets]
            D1DB[(D1 Database<br/>Replicated)]
            R2Storage[R2 Storage<br/>Objects/Files]
            KV[KV Store<br/>Key-Value Cache]
            Images[Cloudflare Images<br/>Optimized Delivery]
        end
    end

    subgraph "Users"
        User1[User in US]
        User2[User in EU]
        User3[User in Asia]
    end

    Code -->|git push| CLI
    CLI -->|Deploy| Worker1
    CLI -->|Deploy| Worker2
    CLI -->|Deploy| Worker3
    CLI -->|Upload| Pages

    User1 -->|Request| Worker1
    User2 -->|Request| Worker2
    User3 -->|Request| Worker3

    Worker1 & Worker2 & Worker3 -->|Query| D1DB
    Worker1 & Worker2 & Worker3 -->|Fetch| R2Storage
    Worker1 & Worker2 & Worker3 -->|Cache| KV
    Worker1 & Worker2 & Worker3 -->|Serve| Pages
    Worker1 & Worker2 & Worker3 -->|Transform| Images

    style Worker1 fill:#f59e0b,stroke:#d97706,color:#fff
    style Worker2 fill:#f59e0b,stroke:#d97706,color:#fff
    style Worker3 fill:#f59e0b,stroke:#d97706,color:#fff
    style Pages fill:#3b82f6,stroke:#1e40af,color:#fff
    style D1DB fill:#10b981,stroke:#059669,color:#fff
```

**Key Points:**
- **Global Distribution**: Code runs in 300+ data centers worldwide
- **Automatic Routing**: Users are routed to the nearest edge location
- **Zero Cold Starts**: Workers spin up in <1ms
- **Unified Platform**: All services (compute, storage, database) in one ecosystem

---

## Authentication Flow

This diagram shows how Better Auth handles user authentication and session management.

```mermaid
sequenceDiagram
    actor User
    participant UI as React UI
    participant Worker as Cloudflare Worker
    participant Auth as Better Auth
    participant DB as D1 Database
    participant OAuth as OAuth Provider<br/>(Google, GitHub)

    Note over User,OAuth: Sign In Flow
    User->>UI: Click "Sign In"
    UI->>Worker: POST /api/auth/sign-in
    Worker->>Auth: signIn(credentials)

    alt Email/Password
        Auth->>DB: Verify credentials
        DB-->>Auth: User found
    else OAuth
        Auth->>OAuth: Redirect to provider
        OAuth-->>Auth: Auth code
        Auth->>OAuth: Exchange for token
        OAuth-->>Auth: User profile
        Auth->>DB: Create/update user
    end

    Auth->>DB: Create session
    DB-->>Auth: Session ID
    Auth-->>Worker: Set cookie
    Worker-->>UI: Redirect to dashboard
    UI-->>User: Logged in

    Note over User,OAuth: Protected Request Flow
    User->>UI: Access protected page
    UI->>Worker: GET /api/customers
    Worker->>Auth: getSession(cookie)
    Auth->>DB: Verify session
    DB-->>Auth: Session valid + user data
    Auth-->>Worker: User object
    Worker->>Worker: Process request
    Worker-->>UI: Protected data
    UI-->>User: Display data

    Note over User,OAuth: Sign Out Flow
    User->>UI: Click "Sign Out"
    UI->>Worker: POST /api/auth/sign-out
    Worker->>Auth: signOut(session)
    Auth->>DB: Delete session
    Auth-->>Worker: Clear cookie
    Worker-->>UI: Redirect to home
    UI-->>User: Logged out
```

**Key Points:**
- **Session-based**: Uses secure HTTP-only cookies
- **Multiple Providers**: Supports email/password, OAuth, magic links
- **Database Sessions**: Sessions stored in D1 for consistency across edge locations
- **Type-safe**: Full TypeScript support for user objects and session data

---

## Monorepo Structure

This diagram shows the recommended structure for a Turborepo-based Fenod Stack monorepo.

```mermaid
graph TB
    subgraph "Monorepo Root"
        subgraph "apps/"
            WebApp[web<br/>TanStack Start App]
            API[api<br/>Hono API Server]
            Docs[docs<br/>Starlight Documentation]
            Mobile[mobile<br/>React Native<br/><i>optional</i>]
        end

        subgraph "packages/"
            UI[ui<br/>shadcn components]
            DB[database<br/>Drizzle schemas]
            Types[types<br/>Shared TypeScript types]
            Config[config<br/>Shared configs<br/>tsconfig, Ultracite]
            Auth[auth<br/>Better Auth setup]
            ORPC_Pkg[orpc<br/>API client/server]
        end
    end

    WebApp -->|imports| UI
    WebApp -->|imports| Types
    WebApp -->|imports| ORPC_Pkg
    WebApp -->|imports| Auth

    API -->|imports| DB
    API -->|imports| Types
    API -->|imports| ORPC_Pkg
    API -->|imports| Auth

    Docs -->|imports| UI
    Mobile -->|imports| UI
    Mobile -->|imports| Types
    Mobile -->|imports| ORPC_Pkg

    UI -->|uses| Config
    DB -->|uses| Config
    API -->|uses| Config
    WebApp -->|uses| Config

    style WebApp fill:#3b82f6,stroke:#1e40af,color:#fff
    style API fill:#10b981,stroke:#059669,color:#fff
    style UI fill:#f59e0b,stroke:#d97706,color:#fff
    style DB fill:#ef4444,stroke:#dc2626,color:#fff
```

**Key Points:**
- **Apps**: Deployable applications (can be deployed independently)
- **Packages**: Shared code used across apps
- **Turborepo**: Intelligent build caching and task orchestration
- **Type Sharing**: Database types flow from `database` package to all consumers

**Example `package.json` structure:**
```json
{
  "name": "my-fenod-project",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint"
  }
}
```

---

## Request Lifecycle

This diagram shows the complete lifecycle of a request in a Fenod Stack application.

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant CF as Cloudflare Edge
    participant Router as TanStack Router
    participant Query as TanStack Query
    participant ORPC as ORPC Client
    participant API as Hono API
    participant Drizzle
    participant D1 as D1 Database

    User->>Browser: Navigate to /customers

    Note over Browser,D1: SSR Phase (Server-side)
    Browser->>CF: GET /customers
    CF->>Router: Route request
    Router->>Router: Match route /customers
    Router->>Query: Prefetch customers.list
    Query->>ORPC: customers.list.query()
    ORPC->>API: POST /api/orpc/customers.list
    API->>Drizzle: db.select().from(customers)
    Drizzle->>D1: SELECT * FROM customers
    D1-->>Drizzle: [rows]
    Drizzle-->>API: Customer[]
    API-->>ORPC: JSON response
    ORPC-->>Query: Typed data
    Query->>Query: Cache data
    Router->>Router: Render with data
    Router-->>Browser: HTML + hydration data
    Browser-->>User: Page displayed instantly

    Note over Browser,D1: Client-side Interaction
    User->>Browser: Click "Add Customer"
    Browser->>Router: Navigate to /customers/new
    Router-->>Browser: Render form
    User->>Browser: Fill form & submit
    Browser->>Query: useMutation(createCustomer)
    Query->>ORPC: customers.create.mutate(data)
    ORPC->>API: POST /api/orpc/customers.create
    API->>Drizzle: db.insert(customers).values(data)
    Drizzle->>D1: INSERT INTO customers...
    D1-->>Drizzle: New customer ID
    Drizzle-->>API: Customer
    API-->>ORPC: JSON response
    ORPC-->>Query: Typed data
    Query->>Query: Invalidate customers cache
    Query->>Query: Refetch customers.list
    Query-->>Browser: Update UI optimistically
    Browser-->>User: Success message + redirect
```

**Key Points:**
- **SSR First**: Initial page load is server-rendered for fast FCP
- **Progressive Enhancement**: Client-side navigation for instant transitions
- **Optimistic Updates**: UI updates before server confirms (then rolls back if error)
- **Smart Caching**: TanStack Query prevents redundant requests

---

## Database Layer

This diagram shows how Drizzle ORM provides type-safe database access.

```mermaid
graph LR
    subgraph "Schema Definition"
        Schema[schema.ts<br/>Drizzle Schema]
    end

    subgraph "Type Generation"
        InferSelect[Type inference<br/>Select types]
        InferInsert[Type inference<br/>Insert types]
        Zod[Zod schemas<br/>Validation]
    end

    subgraph "Database Operations"
        Queries[Type-safe queries<br/>db.select/insert/update]
        Migrations[Migrations<br/>drizzle-kit generate]
    end

    subgraph "Runtime"
        D1[(Cloudflare D1<br/>SQLite)]
    end

    subgraph "API Layer"
        ORPC_API[ORPC Procedures<br/>Input/Output types]
    end

    subgraph "Frontend"
        Components[React Components<br/>Typed props]
    end

    Schema -->|generates| InferSelect
    Schema -->|generates| InferInsert
    Schema -->|generates| Zod
    Schema -->|generates| Migrations

    InferSelect -->|Customer type| ORPC_API
    InferInsert -->|NewCustomer type| ORPC_API
    Zod -->|Validation| ORPC_API

    ORPC_API -->|API types| Components

    Queries -->|uses| Schema
    Queries -->|SQL| D1
    Migrations -->|applies| D1

    style Schema fill:#3b82f6,stroke:#1e40af,color:#fff
    style D1 fill:#10b981,stroke:#059669,color:#fff
    style ORPC_API fill:#f59e0b,stroke:#d97706,color:#fff
    style Components fill:#ef4444,stroke:#dc2626,color:#fff
```

**Example Type Flow:**

```typescript
// 1. Define schema
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
})

// 2. Infer types
export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert

// 3. Use in ORPC procedure
export const getCustomer = procedure
  .input(z.object({ id: z.number() }))
  .output(z.custom<Customer>())
  .query(async ({ input, ctx }) => {
    const [customer] = await ctx.db
      .select()
      .from(customers)
      .where(eq(customers.id, input.id))
    return customer
  })

// 4. Use in React component (fully typed!)
function CustomerDetail({ id }: { id: number }) {
  const { data: customer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.customers.get.query({ id })
  })

  // customer is typed as Customer
  return <div>{customer?.name}</div>
}
```

**Key Points:**
- **Single Source of Truth**: Schema defines database structure and TypeScript types
- **Compile-time Safety**: TypeScript catches type errors before runtime
- **Runtime Validation**: Zod validates data at API boundaries
- **Zero Code Generation**: Types are inferred, not generated

---

## Performance Characteristics

### Cold Start Times

| Service | Cold Start | Notes |
|---------|-----------|-------|
| Cloudflare Workers | <1ms | Isolates, not containers |
| D1 Database | ~50ms | First query after worker spawn |
| R2 Storage | ~100ms | First object fetch |

### Request Latency (p50)

| Operation | Latency | Notes |
|-----------|---------|-------|
| Static asset (Pages) | ~20ms | Cached at edge |
| API call (Worker + D1) | ~80ms | Including database query |
| OAuth redirect | ~200ms | Third-party provider time |
| Image transformation | ~150ms | Cloudflare Images |

### Scalability

- **Concurrent requests**: Unlimited (auto-scaling)
- **Database connections**: Pooled automatically by D1
- **File storage**: Unlimited (R2)
- **Geographic distribution**: 300+ locations automatically

---

## Security Architecture

```mermaid
graph TB
    subgraph "Client Security"
        CSP[Content Security Policy]
        HTTPS[HTTPS Only]
        Cookies[HTTP-only Cookies]
    end

    subgraph "Edge Security"
        WAF[Cloudflare WAF]
        RateLimit[Rate Limiting]
        DDoS[DDoS Protection]
    end

    subgraph "Application Security"
        Auth[Better Auth<br/>Session Management]
        CSRF[CSRF Protection]
        Validation[Input Validation<br/>Zod schemas]
    end

    subgraph "Data Security"
        Encryption[Data Encryption<br/>at rest & in transit]
        Secrets[Cloudflare Secrets<br/>Environment variables]
        RBAC[Role-based Access]
    end

    Client -->|Protected by| CSP
    Client -->|Enforced| HTTPS
    Client -->|Secure sessions| Cookies

    Edge -->|Filters| WAF
    Edge -->|Limits| RateLimit
    Edge -->|Blocks| DDoS

    App -->|Authenticates| Auth
    App -->|Prevents| CSRF
    App -->|Sanitizes| Validation

    Data -->|Encrypted| Encryption
    Data -->|Protected| Secrets
    Data -->|Enforces| RBAC

    style CSP fill:#3b82f6,stroke:#1e40af,color:#fff
    style Auth fill:#10b981,stroke:#059669,color:#fff
    style Encryption fill:#f59e0b,stroke:#d97706,color:#fff
```

**Security Best Practices:**
1. **Never commit secrets** - Use Cloudflare Secrets or Alchemy for environment variables
2. **Validate all inputs** - Use Zod schemas on all ORPC procedures
3. **Use HTTPS only** - Cloudflare enforces TLS 1.3+
4. **Implement CSRF protection** - Better Auth handles this automatically
5. **Rate limit APIs** - Use Cloudflare Rate Limiting for public endpoints
6. **Audit dependencies** - Run `npm audit` regularly, use Ultracite for linting

---

## Next Steps

- **[Development Strategy](development-strategy.md)** - Learn the UI-first workflow
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions
- **[Local Development](local-development.md)** - Docker Compose setup
- **[Architecture Decisions](decisions/)** - Why we chose each technology

---

**Last Updated:** November 2025
