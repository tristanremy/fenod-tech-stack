# Fenod Stack

> [Development Strategy](docs/DEVELOPMENT-STRATEGY.md) | [Data Fetching](docs/TANSTACK-DATA-FETCHING.md) | [Debugging](docs/DEBUGGING.md) | [MCP Guide](docs/MCP-GUIDE.md) | [Astro SEO](docs/ASTRO-SEO-GUIDE.md) | [App Improvement Guide](docs/APP-IMPROVEMENT-GUIDE.md)

## Decision Matrix

| Need | Stack | Deploy |
|------|-------|--------|
| Full-stack app | [TanStack Start](https://tanstack.com/start) + [Hono](https://hono.dev) + [ORPC](https://orpc.unnoq.com) + [Drizzle](https://orm.drizzle.team) + [D1](https://developers.cloudflare.com/d1/) + [Better Auth](https://better-auth.com) | CF Workers |
| Content + SEO | [Astro](https://astro.build) + [TanStack Start](https://tanstack.com/start) | CF Pages |
| SPA (no SEO) | [TanStack Start](https://tanstack.com/start) | CF Workers |
| API only | [Hono](https://hono.dev) + [ORPC](https://orpc.unnoq.com) + [Drizzle](https://orm.drizzle.team) | CF Workers |
| Docs site | [Starlight](https://starlight.astro.build) | CF Pages |
| Monorepo | Add [Turborepo](https://turbo.build) to any above | - |

## Bootstrap

```bash
pnpm create better-t-stack@latest
```

> [create-better-t-stack](https://github.com/AmanVarshney01/create-better-t-stack) - CLI to scaffold the full stack

## Monorepo Structure (Slices Architecture)

> **Architecture**: Feature-based slices instead of technical layers. Each feature contains its own router, service, and types.

```
my-app/
├── apps/
│   ├── web/                    # TanStack Start frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/         # shadcn base components
│   │   │   │   ├── shared/     # Cross-feature components
│   │   │   │   └── {feature}/  # Feature-specific components
│   │   │   ├── features/       # Feature slices (alternative)
│   │   │   │   └── {feature}/
│   │   │   │       ├── components/
│   │   │   │       ├── hooks/
│   │   │   │       └── index.ts
│   │   │   ├── hooks/          # Shared hooks
│   │   │   ├── lib/
│   │   │   │   ├── auth-client.ts
│   │   │   │   ├── orpc.ts     # ORPC client setup
│   │   │   │   └── utils.ts
│   │   │   └── routes/
│   │   │       ├── __root.tsx
│   │   │       └── {route}.tsx
│   │   └── package.json
│   └── server/                 # Hono + ORPC backend
│       ├── src/
│       │   ├── {feature}/      # Feature API routes (if not in packages/api)
│       │   │   ├── api.ts
│       │   │   └── service.ts
│       │   └── index.ts
│       └── package.json
├── packages/
│   ├── api/                    # ORPC routers (slices)
│   │   └── src/
│   │       ├── routers/
│   │       │   ├── {feature}/  # Feature slice
│   │       │   │   ├── index.ts
│   │       │   │   ├── router.ts   # ORPC endpoints
│   │       │   │   └── service.ts  # Business logic + DB
│   │       │   └── index.ts    # Root router
│   │       ├── context.ts      # API context
│   │       └── index.ts        # Procedures (public/protected)
│   ├── auth/                   # Better Auth config
│   │   └── src/
│   │       └── index.ts
│   ├── db/                     # Drizzle schemas
│   │   └── src/
│   │       ├── index.ts
│   │       ├── schema/
│   │       └── migrations/
│   └── shared/                 # Shared types, schemas, utils
│       └── src/
│           ├── types.ts
│           └── schemas.ts
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── alchemy.run.ts              # Cloudflare deployment
```

### Slices vs Layers

| Traditional Layers | Slices Architecture |
|-------------------|---------------------|
| `controllers/`, `services/`, `repositories/` | `features/{feature}/router.ts + service.ts` |
| Cross-cutting changes affect multiple folders | Changes stay within feature folder |
| Technical grouping | Business domain grouping |

## Cloudflare Services

| Service | Use |
|---------|-----|
| [Workers](https://developers.cloudflare.com/workers/) | Serverless compute |
| [Pages](https://developers.cloudflare.com/pages/) | Static sites |
| [D1](https://developers.cloudflare.com/d1/) | SQLite database |
| [R2](https://developers.cloudflare.com/r2/) | Object storage |
| [KV](https://developers.cloudflare.com/kv/) | Key-value store |
| [Images](https://developers.cloudflare.com/images/) | Image optimization |

### Naming Convention

**Pattern:** `{project}-{resource}` for production, `{project}-{resource}-preview` for preview/staging

| Resource | Production | Preview |
|----------|------------|---------|
| D1 | `myapp-db` | `myapp-db-preview` |
| R2 | `myapp-storage` | `myapp-storage-preview` |
| KV | `myapp-kv` | `myapp-kv-preview` |
| Worker | `myapp-api` | `myapp-api-preview` |

Deploy with [Alchemy](https://alchemy.run)

## API Pattern (Hono + ORPC + Drizzle) - Slices Architecture

### packages/api/src/index.ts - Procedures

```ts
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

### packages/api/src/context.ts

```ts
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

### packages/api/src/routers/index.ts - Root Router

```ts
import { todoRouter } from "./todo";
import { eventRouter } from "./event";
import { publicProcedure } from "../index";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  todo: todoRouter,
  event: eventRouter,
};
```

### Feature Slice: packages/api/src/routers/todo/

Each feature is a slice with its own router and service:

```
routers/todo/
├── index.ts      # Public exports
├── router.ts     # ORPC endpoints
└── service.ts    # Business logic + DB operations
```

#### router.ts - ORPC Endpoints

```ts
import z from "zod";
import { publicProcedure, protectedProcedure } from "../../index";
import * as todoService from "./service";

export const todoRouter = {
  getAll: publicProcedure.handler(async () => {
    return await todoService.list();
  }),

  create: protectedProcedure
    .input(z.object({ text: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      return await todoService.create(input.text, context.session.user.id);
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.number(), completed: z.boolean() }))
    .handler(async ({ input }) => {
      return await todoService.toggle(input.id, input.completed);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      return await todoService.remove(input.id);
    }),
};
```

#### service.ts - Business Logic + DB

```ts
import { eq } from "drizzle-orm";
import { db } from "@my-app/db";
import { todo } from "@my-app/db/schema/todo";

export async function list() {
  return await db.select().from(todo);
}

export async function create(text: string, userId: string) {
  return await db.insert(todo).values({ text, createdBy: userId }).returning();
}

export async function toggle(id: number, completed: boolean) {
  return await db
    .update(todo)
    .set({ completed, updatedAt: new Date() })
    .where(eq(todo.id, id))
    .returning();
}

export async function remove(id: number) {
  return await db.delete(todo).where(eq(todo.id, id));
}
```

#### index.ts - Public Exports

```ts
export { todoRouter } from "./router";
export * as todoService from "./service";
```

### apps/server/src/index.ts - Hono Server

```ts
import { env } from "cloudflare:workers";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "@my-app/auth";
import { appRouter } from "@my-app/api/routers/index";
import { createContext } from "@my-app/api/context";

const app = new Hono();

app.use(logger());
app.use("/*", cors({
  origin: env.CORS_ORIGIN || "",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

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

## Auth Pattern (Better Auth + Hono + Drizzle)

### Server Setup

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Hono } from "hono";
import { cors } from "hono/cors";

// Auth instance
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
    },
  }),
  experimental: { joins: true }, // 2-3x perf improvement

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({ to: user.email, subject: "Verify email", text: url });
    },
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({ to: user.email, subject: "Reset password", text: url });
    },
    resetPasswordTokenExpiresIn: 3600,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days
    updateAge: 60 * 60 * 24,      // refresh daily
    freshAge: 60 * 5,             // 5 min for sensitive ops
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      strategy: "jwe", // compact|jwt|jwe
    },
  },

  rateLimit: {
    window: 60,
    max: 100,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 10, max: 3 },
      "/two-factor/verify": { window: 10, max: 3 },
    },
  },

  advanced: {
    ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
  },
});

// Hono app
const app = new Hono();

// CORS before routes
app.use("/api/auth/*", cors({
  origin: process.env.FRONTEND_URL,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["POST", "GET", "OPTIONS"],
  credentials: true,
}));

// Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Session middleware
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user || null);
  c.set("session", session?.session || null);
  await next();
});

// Protected route
app.get("/api/me", (c) => {
  if (!c.get("user")) return c.body(null, 401);
  return c.json({ user: c.get("user") });
});
```

### Client Setup (apps/web/src/lib/auth-client.ts)

```ts
import type { auth } from "@my-app/auth";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL,
  plugins: [inferAdditionalFields<typeof auth>()],
});
```

### Auth Middleware (apps/web/src/middleware/auth.ts)

```ts
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { authClient } from "@/lib/auth-client";

export const authMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const session = await authClient.getSession({
      fetchOptions: { headers: request.headers, throw: true },
    });
    return next({ context: { session } });
  }
);

export const getUser = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => context.session);
```

### Auth Usage

```ts
// Sign up
await authClient.signUp.email({ name, email, password });

// Sign in
await authClient.signIn.email({ email, password, rememberMe: true });

// Get session (reactive hook)
const { data: session } = authClient.useSession();

// Sign out
await authClient.signOut();
```

### Migrations

```bash
pnpm dlx @better-auth/cli@latest generate
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## UI Components

| Library | Use For |
|---------|---------|
| [shadcn/ui](https://ui.shadcn.com) | Base components |
| [Intent UI](https://intentui.com) | Production polish |
| [RE UI](https://reui.io) | Production polish |
| [Tailark](https://tailark.com) | Marketing blocks |
| [shadcnblocks](https://shadcnblocks.com) | Marketing blocks |
| [Origin UI](https://originui.com) | Component variants |
| [Coss UI](https://coss.com/ui) | Cal.com style |
| [Animate UI](https://animate-ui.com) | Animations |
| [Registry Directory](https://registry.directory) | Discover more |

## TanStack

| Package | Use |
|---------|-----|
| [Start](https://tanstack.com/start) | Full-stack React framework |
| [Query](https://tanstack.com/query) | Server state, caching, optimistic updates |
| [Router](https://tanstack.com/router) | Type-safe routing (included in Start) |
| [Form](https://tanstack.com/form) | Type-safe forms with validation |
| [Table](https://tanstack.com/table) | Headless data tables |

### ORPC Client Setup (apps/web/src/utils/orpc.ts)

```ts
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { createRouterClient } from "@orpc/server";
import { QueryClient } from "@tanstack/react-query";
import { appRouter } from "@my-app/api/routers/index";
import { createContext } from "@my-app/api/context";

const getORPCClient = createIsomorphicFn()
  .server(() =>
    createRouterClient(appRouter, {
      context: async ({ req }) => createContext({ context: req }),
    })
  )
  .client(() => {
    const link = new RPCLink({
      url: `${import.meta.env.VITE_SERVER_URL}/rpc`,
      fetch(url, options) {
        return fetch(url, { ...options, credentials: "include" });
      },
    });
    return createORPCClient(link);
  });

export const orpc = createTanstackQueryUtils(getORPCClient());

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 1 },
  },
});
```

### Root Route with Context (apps/web/src/routes/__root.tsx)

```tsx
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { orpc } from "@/utils/orpc";
import Header from "@/components/header";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en">
      <head />
      <body>
        <QueryClientProvider client={queryClient}>
          <Header />
          <main className="container mx-auto py-8">
            <Outlet />
          </main>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### Protected Route Pattern

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  loader: async ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/login" });
    }
  },
});

function DashboardRoute() {
  const { session } = Route.useRouteContext();
  return <div>Welcome, {session?.user?.name}</div>;
}
```

### Data Fetching with ORPC + React Query

```tsx
import { useQuery, useMutation } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

function TodosRoute() {
  const todos = useQuery(orpc.todo.getAll.queryOptions());

  const createMutation = useMutation(
    orpc.todo.create.mutationOptions({
      onSuccess: () => todos.refetch(),
    })
  );

  const toggleMutation = useMutation(
    orpc.todo.toggle.mutationOptions({
      onSuccess: () => todos.refetch(),
    })
  );

  if (todos.isLoading) return <Loader />;
  if (todos.error) return <div>Error: {todos.error.message}</div>;

  return (
    <ul>
      {todos.data?.map((todo) => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() =>
              toggleMutation.mutate({ id: todo.id, completed: !todo.completed })
            }
          />
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

### Form Handling with TanStack Form + Zod

```tsx
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function SignInForm() {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: signInSchema },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        { email: value.email, password: value.password },
        {
          onSuccess: () => {
            navigate({ to: "/dashboard" });
            toast.success("Sign in successful");
          },
          onError: (error) => {
            toast.error(error.error.message);
          },
        }
      );
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field name="email">
        {(field) => (
          <div>
            <Label htmlFor={field.name}>Email</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.map((error, i) => (
              <p key={i} className="text-sm text-red-500">{error?.message}</p>
            ))}
          </div>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <div>
            <Label htmlFor={field.name}>Password</Label>
            <Input
              id={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.map((error, i) => (
              <p key={i} className="text-sm text-red-500">{error?.message}</p>
            ))}
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
```

## Database (Drizzle + D1)

### packages/db/src/schema/todo.ts

```ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todo = sqliteTable("todo", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
});
```

### packages/db/src/schema/auth.ts (Better Auth)

```ts
import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
}));
```

### packages/db/src/index.ts

```ts
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";

export const db = drizzle(env.DB);
```

### packages/db/drizzle.config.ts

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "sqlite",
  driver: "d1-http",
});
```

### Commands

```bash
pnpm drizzle-kit generate          # Generate migrations
pnpm drizzle-kit push              # Push to D1
pnpm wrangler d1 execute DB --local --file=migrations/0001.sql
```

## Styling (Tailwind v4)

### apps/web/src/index.css

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme {
  --font-sans: "Inter", "Geist", ui-sans-serif, system-ui, sans-serif;
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.577 0.245 27.325);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
}
```

### lib/utils.ts

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Tools

| Tool | Use |
|------|-----|
| [Tailwind v4](https://tailwindcss.com) | Styling |
| [Turborepo](https://turbo.build) | Monorepo builds |
| [Ultracite](https://github.com/haydenbleasel/ultracite) | Linting (Biome-based) |
| [Better Upload](https://better-upload.dev) | File uploads to R2 |
| [Polar.sh](https://polar.sh) | Payments |
| [AI SDK](https://sdk.vercel.ai) | LLM integration |
| [AI SDK Elements](https://ai-sdk.dev/elements) | Chat UI components |

## Links

**Core:** [TanStack Start](https://tanstack.com/start) | [Astro](https://astro.build) | [Hono](https://hono.dev) | [ORPC](https://orpc.unnoq.com) | [Drizzle](https://orm.drizzle.team) | [Better Auth](https://better-auth.com)

**Infra:** [Cloudflare](https://developers.cloudflare.com) | [Alchemy](https://alchemy.run) | [Turborepo](https://turbo.build)

**UI:** [shadcn/ui](https://ui.shadcn.com) | [Tailwind](https://tailwindcss.com) | [AI SDK Elements](https://ai-sdk.dev/elements)

**Tools:** [Better Upload](https://better-upload.dev) | [Polar.sh](https://polar.sh) | [AI SDK](https://sdk.vercel.ai) | [Ultracite](https://github.com/haydenbleasel/ultracite) | [Starlight](https://starlight.astro.build)
