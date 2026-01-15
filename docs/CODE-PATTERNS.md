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
