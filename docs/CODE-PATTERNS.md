# Code Patterns

> Copy-paste patterns for common implementations. For architecture context, see [README](../README.md).

## Table of Contents

- [API (Hono + ORPC + Drizzle)](#api-hono--orpc--drizzle)
- [Server Functions](#server-functions)
- [Authentication](#authentication)
- [TanStack Router](#tanstack-router)
- [TanStack Query + ORPC](#tanstack-query--orpc)
- [TanStack Form](#tanstack-form)
- [Database (Drizzle)](#database-drizzle)
- [Styling (Tailwind v4)](#styling-tailwind-v4)
- [UI Patterns](#ui-patterns)
- [AI Integration](#ai-integration)
- [File Upload](#file-upload)
- [TanStack Table](#tanstack-table)
- [TanStack Start + Cloudflare Workers](#tanstack-start--cloudflare-workers)
- [Auxiliary Workers](#auxiliary-workers)
- [Cloudflare Workflows](#cloudflare-workflows)
- [Cloudflare Queues](#cloudflare-queues)
- [Vectorize (RAG)](#vectorize-rag)
- [Agents SDK](#agents-sdk)
- [Configuration](#configuration)

---

## API (Hono + ORPC + Drizzle)

### Procedures Setup

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

### Context

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

### Root Router

```ts
// packages/api/src/routers/index.ts
import { todoRouter } from "./todo";
import { eventRouter } from "./event";
import { publicProcedure } from "../index";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  todo: todoRouter,
  event: eventRouter,
};
```

### Feature Slice: Router

```ts
// packages/api/src/routers/todo/router.ts
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

### Feature Slice: Service

```ts
// packages/api/src/routers/todo/service.ts
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

### Hono Server

```ts
// apps/server/src/index.ts
import { env } from "cloudflare:workers";
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

---

## Server Functions

Alternative to ORPC for single apps without monorepo.

### Basic Server Function

```ts
// app/data/todos.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db";
import { todos } from "@/db/schema";

export const getTodos = createServerFn({ method: "GET" })
  .handler(async () => {
    return await db.select().from(todos);
  });

export const createTodo = createServerFn({ method: "POST" })
  .validator(z.object({ text: z.string().min(1) }))
  .handler(async ({ data }) => {
    return await db.insert(todos).values({ text: data.text }).returning();
  });
```

### With Auth Middleware

```ts
// app/middleware/auth.ts
import { createMiddleware, redirect } from "@tanstack/react-start";
import { auth } from "@/lib/auth";
import { getRequestHeaders } from "@tanstack/react-start/server";

export const authMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });

    if (!session) {
      throw redirect({ to: "/login" });
    }

    return next({ context: { session } });
  }
);
```

```ts
// app/data/todos.ts
import { authMiddleware } from "@/middleware/auth";

export const createTodo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ text: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    return await db.insert(todos).values({
      text: data.text,
      userId: context.session.user.id,
    }).returning();
  });
```

### Generator Functions (Streaming Progress)

```ts
// app/data/import.ts
export type BulkProgress = {
  completed: number;
  total: number;
  current: string;
  status: "processing" | "success" | "failed";
};

export const bulkImport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ urls: z.array(z.string().url()) }))
  .handler(async function* ({ data, context }) {
    const total = data.urls.length;

    for (let i = 0; i < total; i++) {
      const url = data.urls[i];
      
      try {
        await processUrl(url, context.session.user.id);
        yield { completed: i + 1, total, current: url, status: "success" } as BulkProgress;
      } catch {
        yield { completed: i + 1, total, current: url, status: "failed" } as BulkProgress;
      }
    }
  });
```

```tsx
// Usage
function BulkImportButton({ urls }: { urls: string[] }) {
  const [progress, setProgress] = useState<BulkProgress | null>(null);

  async function handleImport() {
    for await (const update of await bulkImport({ data: { urls } })) {
      setProgress(update);
    }
    setProgress(null);
  }

  return (
    <Button onClick={handleImport} disabled={!!progress}>
      {progress ? `${progress.completed}/${progress.total}` : "Import All"}
    </Button>
  );
}
```

---

## Authentication

### Server Setup (Better Auth)

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

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
  experimental: { joins: true },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    freshAge: 60 * 5,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      strategy: "jwe",
    },
  },

  rateLimit: {
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 10, max: 3 },
    },
  },

  advanced: {
    ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
  },
});
```

### Client Setup

```ts
// apps/web/src/lib/auth-client.ts
import type { auth } from "@my-app/auth";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL,
  plugins: [inferAdditionalFields<typeof auth>()],
});
```

### Usage

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

---

## TanStack Router

### Root Route with shellComponent

```tsx
// apps/web/src/routes/__root.tsx
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/theme-provider";
import type { orpc } from "@/utils/orpc";
import appCss from "@/styles.css?url";

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
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
```

### Protected Route

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

### Dynamic SEO

```tsx
export const Route = createFileRoute("/posts/$postId")({
  loader: ({ params }) => getPost(params.postId),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title ?? "Post" },
      { name: "description", content: loaderData?.excerpt ?? "" },
      { property: "og:title", content: loaderData?.title ?? "Post" },
    ],
  }),
  component: PostPage,
});
```

### Type-Safe Search Params

```tsx
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().default(""),
  status: z.enum(["all", "active", "completed"]).default("all"),
  page: z.number().default(1),
});

export const Route = createFileRoute("/items/")({
  validateSearch: zodValidator(searchSchema),
  component: ItemsPage,
});

function ItemsPage() {
  const { q, status, page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <Input
      value={q}
      onChange={(e) => navigate({ search: (prev) => ({ ...prev, q: e.target.value }) })}
    />
  );
}
```

### Layout Groups

```
routes/
├── _auth/                    # No /auth in URL
│   ├── route.tsx             # Shared layout
│   ├── login.tsx             # /login
│   └── register.tsx          # /register
├── _dashboard/               # No /dashboard prefix needed
│   ├── route.tsx             # Layout with sidebar
│   ├── index.tsx             # /dashboard
│   └── settings.tsx          # /dashboard/settings
```

```tsx
// routes/_dashboard/route.tsx
export const Route = createFileRoute("/_dashboard")({
  beforeLoad: async () => {
    const session = await getUser();
    if (!session) throw redirect({ to: "/login" });
    return { session };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## TanStack Query + ORPC

### Client Setup

```ts
// apps/web/src/utils/orpc.ts
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

### Usage

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

---

## TanStack Form

```tsx
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function SignInForm() {
  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: signInSchema },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email({ email: value.email, password: value.password });
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

---

## Database (Drizzle)

### Schema

```ts
// packages/db/src/schema/todo.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todo = sqliteTable("todo", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
});
```

### Auth Schema

```ts
// packages/db/src/schema/auth.ts
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
```

### DB Client

```ts
// packages/db/src/index.ts
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";

export const db = drizzle(env.DB);
```

### Commands

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit push
pnpm wrangler d1 execute DB --local --file=migrations/0001.sql
```

---

## Styling (Tailwind v4)

### CSS Setup

```css
/* apps/web/src/index.css */
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
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
}
```

### Utils

```ts
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Theme Provider

```tsx
// lib/theme-provider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { ScriptOnce } from "@tanstack/react-start";

type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: "system", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <ScriptOnce>
        {`document.documentElement.classList.toggle(
          'dark',
          localStorage.theme === 'dark' ||
          (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
        )`}
      </ScriptOnce>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

---

## UI Patterns

### Error Boundary

```tsx
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center gap-4 p-8">
          <h2>Something went wrong</h2>
          <p className="text-muted-foreground">{this.state.error?.message}</p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Route Error & Pending Components

```tsx
export const Route = createFileRoute("/items/")({
  loader: () => getItems(),
  pendingComponent: () => (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-lg" />
      ))}
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-destructive">{error.message}</p>
      <Button onClick={reset}>Retry</Button>
    </div>
  ),
  component: ItemsPage,
});
```

### Streaming with Suspense

```tsx
import { Suspense, use } from "react";

export const Route = createFileRoute("/items/")({
  loader: () => ({ itemsPromise: getItems() }), // Don't await
  component: ItemsPage,
});

function ItemsPage() {
  const { itemsPromise } = Route.useLoaderData();

  return (
    <Suspense fallback={<Skeleton />}>
      <ItemsList dataPromise={itemsPromise} />
    </Suspense>
  );
}

function ItemsList({ dataPromise }: { dataPromise: Promise<Item[]> }) {
  const items = use(dataPromise);
  return items.map((item) => <ItemCard key={item.id} item={item} />);
}
```

### Empty State

```tsx
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
      <div className="rounded-full bg-muted p-3">
        {icon ?? <Inbox className="h-6 w-6 text-muted-foreground" />}
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && (
        <Button asChild>
          <Link to={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
```

---

## AI Integration

### Chat API Route

```ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = await request.json();

        const result = streamText({
          model: openai("gpt-4o-mini"),
          system: "You are a helpful assistant.",
          messages,
        });

        return result.toDataStreamResponse();
      },
    },
  },
});
```

### Chat Component

```tsx
import { useChat } from "@ai-sdk/react";

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  return (
    <div className="flex h-[600px] flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "rounded-lg px-4 py-2 max-w-[80%]",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
```

---

## File Upload

### Server Setup

```ts
import { createUploadHandler, handleUpload } from "better-upload/server";
import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const uploadHandler = createUploadHandler({
  client: s3Client,
  bucket: process.env.R2_BUCKET!,
  maxFileSize: 10 * 1024 * 1024,
  allowedFileTypes: ["image/*", "application/pdf"],
});

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: ({ request }) => handleUpload(request, uploadHandler),
    },
  },
});
```

### Upload Component

```tsx
import { useUpload } from "better-upload/react";

export function FileUpload({ onUploadComplete }: { onUploadComplete: (url: string) => void }) {
  const { upload, isUploading, progress } = useUpload({
    endpoint: "/api/upload",
    onSuccess: (result) => onUploadComplete(result.url),
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8">
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <span>{isUploading ? `Uploading... ${progress}%` : "Click to upload"}</span>
      </label>
    </div>
  );
}
```

---

## TanStack Table

```tsx
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## TanStack Start + Cloudflare Workers

When deploying TanStack Start to Cloudflare Workers, accessing bindings (D1, KV, env vars) requires specific configuration.

### Vite Config for Cloudflare

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    viteReact(),
  ],
});
```

### Wrangler Config

```jsonc
// wrangler.jsonc
{
  "name": "my-app",
  "compatibility_date": "2025-01-20",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-db",
      "database_id": "your-database-id"
    }
  ],
  "vars": {
    "BETTER_AUTH_SECRET": "your-secret",
    "BETTER_AUTH_URL": "https://your-app.workers.dev"
  }
}
```

Key points:
- `main` must be `@tanstack/react-start/server-entry` (NOT `dist/server/server.js`)
- No `assets` config needed - the cloudflare vite plugin handles it

### Accessing Bindings in Server Handlers

Use `import { env } from "cloudflare:workers"` to access bindings:

```ts
// src/lib/env.ts
import type { D1Database } from "@cloudflare/workers-types";

export interface CloudflareEnv {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

declare module "cloudflare:workers" {
  const env: CloudflareEnv;
}
```

```ts
// src/routes/api/example.ts
import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import type { CloudflareEnv } from "~/lib/env";

export const Route = createFileRoute("/api/example")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cfEnv = env as CloudflareEnv;
        
        if (!cfEnv?.DB) {
          return new Response(JSON.stringify({ error: "Server configuration error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Use cfEnv.DB for Drizzle, cfEnv.BETTER_AUTH_SECRET for auth, etc.
        const { drizzle } = await import("drizzle-orm/d1");
        const db = drizzle(cfEnv.DB);
        
        // ... your logic
      },
    },
  },
});
```

### Better Auth with Cloudflare

```ts
// src/lib/auth.ts
import type { D1Database } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "~/db";
import type { CloudflareEnv } from "~/lib/env";

export function createAuth(env?: CloudflareEnv, cf?: unknown) {
  const db = env ? drizzle(env.DB, { schema }) : ({} as ReturnType<typeof drizzle>);

  return betterAuth({
    ...withCloudflare(
      {
        autoDetectIpAddress: true,
        cf: cf || {},
        d1: env
          ? {
              db,
              options: {
                usePlural: true, // tables: users, sessions, accounts
                debugLogs: false,
              },
            }
          : undefined,
      },
      {
        secret: env?.BETTER_AUTH_SECRET,
        baseURL: env?.BETTER_AUTH_URL,
        trustedOrigins: [
          "https://your-app.workers.dev",
          "http://localhost:5173",
        ],
        emailAndPassword: { enabled: true },
        session: {
          cookieCache: { enabled: true, maxAge: 60 * 5 },
        },
      }
    ),
    ...(env
      ? {}
      : {
          database: drizzleAdapter({} as D1Database, {
            provider: "sqlite",
            usePlural: true,
          }),
        }),
  });
}

// Export for CLI schema generation
export const auth = createAuth();
```

### Auth Route Handler

```ts
// src/routes/api/auth/$.ts
import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import type { CloudflareEnv } from "~/lib/env";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
      GET: async ({ request }) => {
        const cfEnv = env as CloudflareEnv;
        if (!cfEnv?.DB) {
          return new Response(JSON.stringify({ error: "Server configuration error" }), {
            status: 500,
          });
        }
        
        const cf = (request as unknown as { cf?: unknown }).cf;
        const { createAuth } = await import("~/lib/auth");
        const auth = createAuth(cfEnv, cf);
        return auth.handler(request);
      },
      POST: async ({ request }) => {
        const cfEnv = env as CloudflareEnv;
        if (!cfEnv?.DB) {
          return new Response(JSON.stringify({ error: "Server configuration error" }), {
            status: 500,
          });
        }
        
        const cf = (request as unknown as { cf?: unknown }).cf;
        const { createAuth } = await import("~/lib/auth");
        const auth = createAuth(cfEnv, cf);
        return auth.handler(request);
      },
    },
  },
});
```

### Common Pitfalls

| Issue | Solution |
|-------|----------|
| Error 1101 on deploy | Use dynamic `await import()` for drizzle-orm, better-auth |
| "Server configuration error" | Check `wrangler.jsonc` main is `@tanstack/react-start/server-entry` |
| "model 'user' not found" | Set `usePlural: true` if tables are `users`, `sessions` (plural) |
| Missing geolocation fields | Run `npx @better-auth/cli generate` and apply migration |

---

## Auxiliary Workers

Run additional Workers alongside your main TanStack Start app for background tasks, scheduled jobs, or queue consumers.

### Vite Config

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    tanstackStart(),
    cloudflare({
      viteEnvironment: { name: "ssr" },
      auxiliaryWorkers: [
        { configPath: "./wrangler.queue-consumer.jsonc" },
        { configPath: "./wrangler.scheduled.jsonc" },
      ],
    }),
  ],
});
```

### Auxiliary Worker Config

```jsonc
// wrangler.queue-consumer.jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "my-app-queue-consumer",
  "main": "src/workers/queue-consumer.ts",
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat_v2"],
  "queues": {
    "consumers": [{ "queue": "my-queue", "max_batch_size": 10 }]
  }
}
```

### Service Binding (Main → Auxiliary)

```jsonc
// wrangler.jsonc (main app)
{
  "services": [
    { "binding": "QUEUE_WORKER", "service": "my-app-queue-consumer" }
  ]
}
```

**Requirements:** Vite 7+, `@cloudflare/vite-plugin`

---

## Cloudflare Workflows

Durable multi-step jobs with automatic retries, state persistence, and long-running execution (minutes → weeks).

### When to Use

- User lifecycle (onboarding → trial reminder → conversion check)
- Data pipelines with retry logic
- Human-in-the-loop approvals
- Scheduled tasks that span days

### Workflow Class

```ts
// src/workflows/user-lifecycle.ts
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";

type Env = { USER_WORKFLOW: Workflow; DB: D1Database };
type Params = { userId: string; email: string };

export class UserLifecycleWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    await step.do("send welcome email", async () => {
      await sendEmail(event.payload.email, "Welcome!");
    });

    await step.sleep("trial period", "7 days");

    const hasConverted = await step.do("check conversion", async () => {
      const user = await this.env.DB.prepare(
        "SELECT subscription_status FROM users WHERE id = ?"
      ).bind(event.payload.userId).first();
      return user?.subscription_status === "active";
    });

    if (!hasConverted) {
      await step.do("send trial ending email", async () => {
        await sendEmail(event.payload.email, "Your trial is ending soon");
      });
    }
  }
}
```

### Configuration

```jsonc
// wrangler.jsonc
{
  "workflows": [
    {
      "name": "user-lifecycle-workflow",
      "binding": "USER_WORKFLOW",
      "class_name": "UserLifecycleWorkflow"
    }
  ]
}
```

### Triggering Workflows

```ts
// From API route or server function
const instance = await env.USER_WORKFLOW.create({
  id: `user-${userId}-onboarding`,
  params: { userId, email },
});

// Check status
const status = await instance.status();

// Send event (for waitForEvent steps)
await instance.sendEvent({ type: "approved", payload: { approvedBy: adminId } });
```

### Step Options

```ts
await step.do(
  "fetch external API",
  {
    retries: { limit: 5, delay: "30s", backoff: "exponential" },
    timeout: "2 minutes",
  },
  async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
  }
);
```

### Best Practices

| Do | Don't |
|----|-------|
| One API call per step | Giant steps with multiple calls |
| Return state from steps | Store state in variables outside steps |
| Use deterministic step names | Dynamic names like `step-${Date.now()}` |
| Store large data in R2, return refs | Return 1MB+ from steps |

**For AI agents with tool calls:** See [Durable AI Agent](#durable-ai-agent-workflows--agents-sdk) pattern combining Workflows + Agents SDK.

---

## Cloudflare Queues

Async message processing with guaranteed at-least-once delivery.

### When to Use

- Background job processing
- API buffering / rate limiting
- Event-driven workflows
- Decoupling services

### Producer (Send Messages)

```ts
// From any Worker or server function
await env.MY_QUEUE.send({
  type: "process-image",
  imageId: "123",
  userId: "user-456",
});

// Batch send
await env.MY_QUEUE.sendBatch([
  { body: { type: "email", to: "a@example.com" } },
  { body: { type: "email", to: "b@example.com" } },
]);
```

### Consumer (Process Messages)

```ts
// src/workers/queue-consumer.ts
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        await processMessage(msg.body, env);
        msg.ack();
      } catch (error) {
        msg.retry({ delaySeconds: 60 });
      }
    }
  },
};

async function processMessage(body: unknown, env: Env) {
  const message = body as { type: string; [key: string]: unknown };
  
  switch (message.type) {
    case "process-image":
      await processImage(message.imageId as string, env);
      break;
    case "send-email":
      await sendEmail(message.to as string, message.subject as string);
      break;
  }
}
```

### Configuration

```jsonc
// wrangler.jsonc
{
  "queues": {
    "producers": [{ "binding": "MY_QUEUE", "queue": "my-queue" }],
    "consumers": [
      {
        "queue": "my-queue",
        "max_batch_size": 10,
        "max_retries": 3,
        "dead_letter_queue": "my-queue-dlq"
      }
    ]
  }
}
```

### CLI Commands

```bash
wrangler queues create my-queue
wrangler queues create my-queue-dlq
wrangler queues consumer add my-queue my-worker
```

---

## Vectorize (RAG)

Vector database for semantic search, recommendations, and RAG applications.

### Setup

```bash
# Create index (immutable after creation)
wrangler vectorize create doc-search --dimensions=768 --metric=cosine

# Create metadata indexes BEFORE inserting vectors
wrangler vectorize create-metadata-index doc-search --property-name=category --type=string
wrangler vectorize create-metadata-index doc-search --property-name=published --type=number
```

### Configuration

```jsonc
// wrangler.jsonc
{
  "vectorize": [
    { "binding": "VECTORIZE", "index_name": "doc-search" }
  ],
  "ai": { "binding": "AI" }
}
```

### Indexing Documents

```ts
// Generate embeddings and store
async function indexDocument(doc: Document, env: Env) {
  const embeddings = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
    text: [doc.content],
  });

  await env.VECTORIZE.upsert([
    {
      id: doc.id,
      values: embeddings.data[0],
      metadata: {
        title: doc.title,
        category: doc.category,
        published: Math.floor(doc.publishedAt.getTime() / 1000),
        url: doc.url,
      },
    },
  ]);
}
```

### RAG Query Pattern

```ts
async function ragQuery(query: string, env: Env) {
  // 1. Generate query embedding
  const embeddings = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
    text: [query],
  });

  // 2. Search Vectorize
  const matches = await env.VECTORIZE.query(embeddings.data[0], {
    topK: 5,
    returnMetadata: "all",
    filter: { category: "docs" },
  });

  // 3. Fetch full documents from R2/D1
  const documents = await Promise.all(
    matches.matches.map(async (match) => {
      const obj = await env.R2_DOCS.get(match.metadata?.url as string);
      return obj?.text();
    })
  );

  // 4. Generate response with context
  const context = documents.filter(Boolean).join("\n\n");
  const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [
      { role: "system", content: `Answer based on context:\n${context}` },
      { role: "user", content: query },
    ],
  });

  return { answer: response.response, sources: matches.matches };
}
```

### Embedding Models

| Model | Dimensions | Best For |
|-------|------------|----------|
| `@cf/baai/bge-base-en-v1.5` | 768 | English text (balanced) |
| `@cf/baai/bge-small-en-v1.5` | 384 | Fast, lower accuracy |
| `@cf/baai/bge-large-en-v1.5` | 1024 | Higher accuracy |

### Best Practices

- Create metadata indexes BEFORE inserting vectors
- Use `upsert` for updates (insert ignores duplicates)
- Batch inserts: 1000-2500 vectors per batch
- Use namespaces for tenant isolation (faster than metadata filters)
- `returnMetadata: "indexed"` for speed, `"all"` when needed

---

## Agents SDK

Stateful AI agents with persistent memory, WebSockets, and scheduling.

### When to Use

- Chat interfaces with persistent memory
- Real-time collaborative AI
- Long-running AI workflows
- Per-user AI state

### Agent Class

```ts
// src/agents/chat-agent.ts
import { Agent } from "agents";

interface AgentState {
  messages: Array<{ role: string; content: string }>;
  preferences: Record<string, unknown>;
}

export class ChatAgent extends Agent<Env, AgentState> {
  onStart() {
    this.sql`CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      messages TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    )`;
  }

  async onRequest(request: Request): Promise<Response> {
    const { message } = await request.json();

    // Add to state
    this.state.messages.push({ role: "user", content: message });

    // Generate response
    const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: this.state.messages,
    });

    this.state.messages.push({ role: "assistant", content: response.response });

    return Response.json({ response: response.response });
  }

  onStateUpdate(state: AgentState) {
    // Persist to SQL on state change
    this.sql`INSERT OR REPLACE INTO conversations (id, messages) 
             VALUES (${this.id}, ${JSON.stringify(state.messages)})`;
  }
}
```

### Configuration

```jsonc
// wrangler.jsonc
{
  "durable_objects": {
    "bindings": [
      { "name": "CHAT_AGENT", "class_name": "ChatAgent" }
    ]
  },
  "ai": { "binding": "AI" }
}
```

### Usage

```ts
// Get or create agent per user
const id = env.CHAT_AGENT.idFromName(`user-${userId}`);
const agent = env.CHAT_AGENT.get(id);

// Send message
const response = await agent.fetch(request);
```

### WebSocket Support

```ts
export class RealtimeAgent extends Agent<Env> {
  onConnect(connection: Connection) {
    connection.send(JSON.stringify({ type: "connected", agentId: this.id }));
  }

  onMessage(connection: Connection, message: string) {
    const data = JSON.parse(message);
    // Process and broadcast
    this.broadcast(JSON.stringify({ type: "update", data }));
  }

  onDisconnect(connection: Connection) {
    // Cleanup
  }
}
```

### Durable AI Agent (Workflows + Agents SDK)

Combine Workflows for durable execution with Agents SDK for real-time UI updates.

**Workflow with Tool Calls:**

```ts
// src/workflows/research-agent.ts
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";
import Anthropic from "@anthropic-ai/sdk";

type Params = { task: string; agentId: string };

export class ResearchWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const client = new Anthropic({ apiKey: this.env.ANTHROPIC_API_KEY });
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: event.payload.task },
    ];

    const tools = [
      {
        name: "search_repos",
        description: "Search GitHub repositories",
        input_schema: {
          type: "object" as const,
          properties: { query: { type: "string" } },
          required: ["query"],
        },
      },
    ];

    for (let turn = 0; turn < 10; turn++) {
      // Push progress to Agent for real-time UI
      await this.pushProgress(event.payload.agentId, {
        status: "thinking",
        turn,
      });

      const response = await step.do(
        `llm-turn-${turn}`,
        { retries: { limit: 3, delay: "10 seconds", backoff: "exponential" } },
        async () => {
          const msg = await client.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 4096,
            tools,
            messages,
          });
          return JSON.parse(JSON.stringify(msg));
        }
      );

      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason === "end_turn") {
        const textBlock = response.content.find(
          (b): b is Anthropic.TextBlock => b.type === "text"
        );
        return { status: "complete", result: textBlock?.text };
      }

      // Execute tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;

        await this.pushProgress(event.payload.agentId, {
          status: "tool_call",
          tool: block.name,
        });

        const result = await step.do(`tool-${turn}-${block.id}`, async () => {
          return await this.executeTool(block.name, block.input);
        });

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }

      messages.push({ role: "user", content: toolResults });
    }

    return { status: "max_turns_reached" };
  }

  private async pushProgress(agentId: string, progress: unknown) {
    const agent = this.env.RESEARCH_AGENT.get(
      this.env.RESEARCH_AGENT.idFromName(agentId)
    );
    await agent.updateProgress(progress);
  }

  private async executeTool(name: string, input: unknown): Promise<string> {
    // Tool implementations
    return `Result for ${name}`;
  }
}
```

**Agent for Real-time Updates:**

```ts
// src/agents/research-agent.ts
import { Agent } from "agents";

interface State {
  status: string;
  progress: unknown[];
}

export class ResearchAgent extends Agent<Env, State> {
  initialState: State = { status: "idle", progress: [] };

  async updateProgress(progress: unknown) {
    this.setState({
      ...this.state,
      progress: [...this.state.progress, progress],
    });
  }

  async startResearch(task: string) {
    const instance = await this.env.RESEARCH_WORKFLOW.create({
      params: { task, agentId: this.name },
    });
    this.setState({ ...this.state, status: "running" });
    return instance.id;
  }
}
```

**React Client:**

```tsx
import { useAgent } from "agents/react";

function ResearchUI() {
  const [state, setState] = useState({ status: "idle", progress: [] });

  useAgent({
    agent: "research-agent",
    name: `user-${userId}`,
    onStateUpdate: (newState) => setState(newState),
  });

  return (
    <div>
      <p>Status: {state.status}</p>
      {state.progress.map((p, i) => (
        <div key={i}>{JSON.stringify(p)}</div>
      ))}
    </div>
  );
}
```

| Pattern | Use Case |
|---------|----------|
| Workflow alone | Background tasks, no UI needed |
| Agent alone | Real-time chat, short interactions |
| Workflow + Agent | Long-running AI with real-time progress |

---

## Configuration

### vite.config.ts

```ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
    react(),
  ],
});
```

### start.ts (Entry)

```ts
import { createMiddleware, createStart } from "@tanstack/react-start";
import { auth } from "./lib/auth";
import { getRequestHeaders } from "@tanstack/react-start/server";

const loggingMiddleware = createMiddleware({ type: "request" }).server(
  ({ request, next }) => {
    console.log(`[${request.method}] ${new URL(request.url).pathname}`);
    return next();
  }
);

export const startInstance = createStart(() => ({
  requestMiddleware: [loggingMiddleware],
}));
```
