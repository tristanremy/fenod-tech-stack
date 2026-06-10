---
title: "Modèles de Code"
verified: 2026-06
---

[Available in English](/fr/code-patterns/)

> Modèles copier-coller pour les implémentations courantes. Pour le contexte de l'architecture, voir [README](./).

## Table des matières

- [API (Hono + ORPC + Drizzle)](#api-hono--orpc--drizzle)
- [Fonctions du serveur](#server-functions)
- [Authentification](#authentication)
- [Routeur TanStack](#tanstack-router)
- [Requête TanStack + ORPC](#tanstack-query--orpc)
- [Formulaire TanStack](#tanstack-form)
- [Base de données (Bruine)](#database-drizzle)
- [Style (Tailwind v4)](#styling-tailwind-v4)
- [Réagir aux meilleures pratiques](#react-best-practices)
- [Modèles d'interface utilisateur](#ui-patterns)
- [Intégration IA](#ai-integration)
- [Téléchargement de fichiers](#file-upload)
- [Tableau TanStack](#tanstack-table)
- [TanStack Start + Cloudflare Workers](#tanstack-start--cloudflare-workers)
- [Ouvriers Auxiliaires](#auxiliary-workers)
- [Flux de travail Cloudflare](#cloudflare-workflows)
- [Files d'attente Cloudflare](#cloudflare-queues)
- [Vectoriser (RAG)](#vectorize-rag)
- [SDK Agents](#agents-sdk)
- [Configuration](#configuration)

---

## API (Hono + ORPC + Bruine)

### Configuration des procédures

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

### Contexte

```

ts
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

### Routeur racine

```

ts
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

### Tranche de fonctionnalités : routeur

```

ts
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

### Tranche de fonctionnalités : Service

```

ts
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

### Serveur Hono

```

ts
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

### Configuration de la sécurité (v4.11.4+)

Depuis Hono v4.11.4, le middleware JWT nécessite une configuration `alg` explicite pour empêcher les attaques par confusion d'algorithmes.

```

ts
import { jwt } from "hono/jwt";

app.use(
  "/api/*",
  jwt({
    secret: env.JWT_SECRET,
    alg: "HS256", // REQUIRED - prevents algorithm confusion
  })
);
```

Pour JWKS (clés asymétriques) :

```

ts
import { jwk } from "hono/jwk";

app.use(
  "/api/*",
  jwk({
    jwks_uri: "https://example.com/.well-known/jwks.json",
    alg: ["RS256"], // REQUIRED - asymmetric algorithms only
  })
);
```

### CSRF avec validation d'origine asynchrone (v4.10.8+)

```

ts
import { csrf } from "hono/csrf";

app.use(
  csrf({
    origin: async (origin, c) => {
      const allowedOrigins = await getAllowedOrigins(c.env.DB);
      return allowedOrigins.includes(origin);
    },
  })
);
```

### Stockage de contexte avec accès sécurisé (v4.11.0+)

Utilisez `tryGetContext()` lorsque la disponibilité du contexte n'est pas garantie :

```

ts
import { tryGetContext } from "hono/context-storage";

function getOptionalUser() {
  const context = tryGetContext<Env>();
  return context?.var.user ?? null;
}
```

### Type de réponse NotFoundResponse personnalisé (v4.11.0+)

Améliorez l'inférence de type côté client pour les réponses 404 :

```

ts
import { Hono, TypedResponse } from "hono";

declare module "hono" {
  interface NotFoundResponse
    extends Response,
      TypedResponse<{ error: string }, 404, "json"> {}
}

const app = new Hono()
  .get("/posts/:id", async (c) => {
    const post = await getPost(c.req.param("id"));
    if (!post) {
      return c.notFound(); // Now typed as { error: string } with 404
    }
    return c.json({ post }, 200);
  })
  .notFound((c) => c.json({ error: "not found" }, 404));
```

### URL saisie pour Hono Client (v4.11.0+)

Obtenez des types d'URL précis à utiliser avec SWR/React Query :

```

ts
const client = hc<typeof app, "http://localhost:8787">(
  "http://localhost:8787/"
);

const url = client.api.posts.$url();
// TypedURL with precise protocol, host, and path
```

---

## Fonctions du serveur

Alternative à ORPC pour les applications uniques sans monorepo.

### Fonction serveur de base

```

ts
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

### Avec le middleware d'authentification

```

ts
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

```

ts
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

### Fonctions du générateur (progression du streaming)

```

ts
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

```

tsx
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

## Authentification

### Configuration du serveur (meilleure authentification)

```

ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: env.DB, // D1 binding — auto-detected in v1.5.0+
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

### Configuration du client

```

ts
// apps/web/src/lib/auth-client.ts
import type { auth } from "@my-app/auth";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL,
  plugins: [inferAdditionalFields<typeof auth>()],
});
```

### Utilisation

```

ts
// Sign up
await authClient.signUp.email({ name, email, password });

// Sign in
await authClient.signIn.email({ email, password, rememberMe: true });

// Get session (reactive hook)
const { data: session } = authClient.useSession();

// Sign out
await authClient.signOut();
```

### Amorçage du premier utilisateur administrateur

Lorsque l'inscription publique est désactivée, vous devez définir directement le premier utilisateur administrateur. Le `auth.api.signUpEmail` de Better Auth avale les erreurs et le `auth.api.hashPassword` n'existe pas — utilisez plutôt le `better-auth/crypto`.

**Le modèle** : point de terminaison POST temporaire qui crée des tables, hache le mot de passe et insère l'utilisateur + le compte + le rôle via le SQL D1 brut. Retirer après utilisation.

```

ts
// apps/server/src/routes/auth.ts (temporary seed endpoint)
import { auth } from "@my-app/auth";
import { hashPassword } from "better-auth/crypto";
import { Hono } from "hono";

const authRoutes = new Hono();

// Block public sign-up
authRoutes.post("/sign-up/email", (c) =>
  c.json({ error: "Sign up is disabled. Contact an administrator." }, 403),
);

// Temporary — remove after seeding
authRoutes.post("/seed-admin", async (c) => {
  try {
    const { env } = await import("cloudflare:workers");
    const raw = env.DB as D1Database;

    // Create auth tables (Better Auth expects these)
    await raw.exec(`
      CREATE TABLE IF NOT EXISTS user (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, email_verified INTEGER NOT NULL DEFAULT 0, image TEXT, created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)), updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)));
      CREATE TABLE IF NOT EXISTS session (id TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)), updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)), ip_address TEXT, user_agent TEXT, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE);
      CREATE TABLE IF NOT EXISTS account (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, provider_id TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, access_token TEXT, refresh_token TEXT, id_token TEXT, access_token_expires_at INTEGER, refresh_token_expires_at INTEGER, scope TEXT, password TEXT, created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)), updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)));
      CREATE TABLE IF NOT EXISTS verification (id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)), updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)));
    `);

    // Admin plugin columns (if using better-auth admin plugin)
    await raw.exec("ALTER TABLE user ADD COLUMN role TEXT").catch(() => {});
    await raw.exec("ALTER TABLE user ADD COLUMN banned INTEGER DEFAULT 0").catch(() => {});
    await raw.exec("ALTER TABLE user ADD COLUMN ban_reason TEXT").catch(() => {});
    await raw.exec("ALTER TABLE user ADD COLUMN ban_expires INTEGER").catch(() => {});

    const uid = crypto.randomUUID();
    const aid = crypto.randomUUID();
    const now = Date.now();

    // Hash password using Better Auth's own crypto
    const hashedPassword = await hashPassword("admin1234");

    await raw.batch([
      raw.prepare(
        `INSERT OR IGNORE INTO user (id, name, email, email_verified, created_at, updated_at, role) VALUES (?, ?, ?, 1, ?, ?, 'admin')`
      ).bind(uid, "Admin", "admin@my-app.local", now, now),
      raw.prepare(
        `INSERT OR IGNORE INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES (?, ?, 'credential', ?, ?, ?, ?)`
      ).bind(aid, uid, uid, hashedPassword, now, now),
    ]);

    return c.json({ ok: true, email: "admin@my-app.local", userId: uid });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message }, 500);
  }
});

authRoutes.on(["POST", "GET"], "/*", (c) => auth.handler(c.req.raw));

export { authRoutes };
```

**Exécutez-le :**

```

bash
curl -X POST http://localhost:3000/api/auth/seed-admin
```

**Ensuite, supprimez la route `seed-admin` et l'importation `better-auth/crypto`.**

**Principaux pièges :**
| Piège | Solutions |
|---------|----------|
| `auth.api.hashPassword` n'existe pas | Utiliser `import { hashPassword } from "better-auth/crypto"` |
| `auth.api.signUpEmail` avale les erreurs | Contournez-le entièrement – ​​insérez via SQL brut |
| Tableaux D1 pas encore créés | Utiliser `CREATE TABLE IF NOT EXISTS` dans le point final de départ |
| Colonnes du plugin d'administration manquantes | `ALTER TABLE user ADD COLUMN role TEXT` (avec `.catch(() => {})` pour l'idempotence) |
| Le fichier SQLite direct écrit de manière invisible sur miniflare | Passez toujours par la liaison D1 du travailleur en cours d'exécution |

---

## Routeur TanStack

### Route racine avec shellComponent

```

tsx
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

### Itinéraire protégé

```

tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
  beforeLoad: async () => {
    const session = await getUser();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    return { session };
  },
});

function DashboardRoute() {
  const { session } = Route.useRouteContext();
  return <div>Welcome, {session?.user?.name}</div>;
}
```

### SEO dynamique

```

tsx
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

### Paramètres de recherche de type sécurisé

```

tsx
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

### Groupes de mise en page

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

```

tsx
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

## Requête TanStack + ORPC

### Configuration du client

```

ts
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

### Utilisation

```

tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

function TodosRoute() {
  const todos = useQuery(orpc.todo.getAll.queryOptions());

  const queryClient = useQueryClient();

  const createMutation = useMutation(
    orpc.todo.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.todo.getAll.queryOptions().queryKey }),
    })
  );

  const toggleMutation = useMutation(
    orpc.todo.toggle.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.todo.getAll.queryOptions().queryKey }),
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

## Formulaire TanStack

```

tsx
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

## Base de données (Bruine)

### Schéma

```

ts
// packages/db/src/schema/todo.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todo = sqliteTable("todo", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
});
```

### Schéma d'authentification

```

ts
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

### Client de base de données

```

ts
// packages/db/src/index.ts
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";

export const db = drizzle(env.DB);
```

### Commandes

```

bash
pnpm drizzle-kit generate
pnpm drizzle-kit push
pnpm wrangler d1 execute DB --local --file=migrations/0001.sql
```

---

## Style (Tailwind v4)

### Configuration CSS

```

css
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

### Utilitaires

```

ts
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Fournisseur de thème

```

tsx
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

## Meilleures pratiques de réaction

Gardez React simple par défaut :

- les données du serveur résident dans TanStack Query ou dans les chargeurs de routes ;
- les valeurs dérivées restent en rendu, pas `useEffect` + état dupliqué ;
- les tableaux statiques comme les colonnes de tableaux vivent en dehors des composants ;
- les boutons à icônes uniquement ont `aria-label` ;
- Les codes HTML dangereux et les secrets côté client ne sont pas autorisés.

Utilisez [React Best Practices](/fr/react-best-practices/) pour la liste de contrôle légère complète et le modèle de configuration React Doctor.

---

## Modèles d'interface utilisateur

### Limite d'erreur

```

tsx
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

### Erreur de route et composants en attente

```

tsx
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

### Streaming avec suspense

```

tsx
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

### État vide

```

tsx
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

## Intégration de l'IA

> **Voir aussi :** Pour une comparaison des fournisseurs, un guide de sélection de modèle et des modèles de configuration, voir [Fournisseurs d'IA](/fr/ai-providers/).

### Route de l'API de chat

```

ts
import { chat, toServerSentEventsResponse } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = await request.json();

        const stream = chat({
          adapter: openaiText("gpt-4o-mini"),
          system: "You are a helpful assistant.",
          messages,
        });

        return toServerSentEventsResponse(stream);
      },
    },
  },
});
```

### Composant de discussion

```

tsx
import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { useState } from "react";

export function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, isLoading } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

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
              {message.parts.map((part, index) =>
                part.type === "text" ? <span key={index}>{part.content}</span> : null
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
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

## Téléchargement de fichiers

### Configuration du serveur

```

ts
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

### Télécharger le composant

```

tsx
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

## Table TanStack

```

tsx
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

## TanStack Start + Travailleurs Cloudflare

Lors du déploiement de TanStack Start sur Cloudflare Workers, l'accès aux liaisons (D1, KV, env vars) nécessite une configuration spécifique.

### Configuration Vite pour Cloudflare

```

ts
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

### Configuration du Wrangler

```

jsonc
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

Points clés :
- `main` doit être `@tanstack/react-start/server-entry` (PAS `dist/server/server.js`)
- Aucune configuration `assets` nécessaire - le plugin cloudflare vite le gère

### Accès aux liaisons dans les gestionnaires de serveur

Utilisez `import { env } from "cloudflare:workers"` pour accéder aux liaisons :

```

ts
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

```

ts
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

### Meilleure authentification avec Cloudflare

```

ts
// src/lib/auth.ts
import type { D1Database } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import type { CloudflareEnv } from "~/lib/env";

export function createAuth(env: CloudflareEnv) {
  return betterAuth({
    database: env.DB, // D1 binding — auto-detected in v1.5.0+
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [
      "https://your-app.workers.dev",
      "http://localhost:5173",
    ],
    emailAndPassword: { enabled: true },
    session: {
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
    },
  });
}

// Export for CLI schema generation (outside Workers runtime)
export const auth = betterAuth({
  database: {} as D1Database,
});
```

### Gestionnaire de route d'authentification

```

ts
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

        const { createAuth } = await import("~/lib/auth");
        const auth = createAuth(cfEnv);
        return auth.handler(request);
      },
      POST: async ({ request }) => {
        const cfEnv = env as CloudflareEnv;
        if (!cfEnv?.DB) {
          return new Response(JSON.stringify({ error: "Server configuration error" }), {
            status: 500,
          });
        }

        const { createAuth } = await import("~/lib/auth");
        const auth = createAuth(cfEnv);
        return auth.handler(request);
      },
    },
  },
});
```

### Pièges courants

| Problème | Solutions |
|-------|--------------|
| Erreur 1101 lors du déploiement | Utilisez les `await import()` dynamiques pour une meilleure authentification |
| "Erreur de configuration du serveur" | Vérifiez que `wrangler.jsonc` principal est `@tanstack/react-start/server-entry` |
| L'authentification échoue sur les travailleurs | Activer l'indicateur de compatibilité `nodejs_compat` dans `wrangler.toml` |
| "modèle 'utilisateur' introuvable" | Définir `usePlural: true` dans le schéma si les tables sont `users`, `sessions` (pluriel) |
| Champs de géolocalisation manquants | Exécutez `pnpm dlx @better-auth/cli generate` et appliquez la migration |

---

## Travailleurs auxiliaires

Exécutez des Workers supplémentaires aux côtés de votre application TanStack Start principale pour les tâches en arrière-plan, les tâches planifiées ou les consommateurs de file d'attente.

### Configuration Vite

```

ts
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

### Configuration du travailleur auxiliaire

```

jsonc
// wrangler.queue-consumer.jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "my-app-queue-consumer",
  "main": "src/workers/queue-consumer.ts",
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat"],
  "queues": {
    "consumers": [{ "queue": "my-queue", "max_batch_size": 10 }]
  }
}
```

### Liaison de service (Principal → Auxiliaire)

```

jsonc
// wrangler.jsonc (main app)
{
  "services": [
    { "binding": "QUEUE_WORKER", "service": "my-app-queue-consumer" }
  ]
}
```

**Exigences :** Vite 7+, `@cloudflare/vite-plugin`

---

## Flux de travail Cloudflare

Travaux durables en plusieurs étapes avec tentatives automatiques, persistance de l'état et exécution de longue durée (minutes → semaines).

### Quand l'utiliser

- Cycle de vie de l'utilisateur (intégration → rappel d'essai → contrôle de conversion)
- Pipelines de données avec logique de nouvelle tentative
- Approbations humaines
- Tâches planifiées qui s'étendent sur plusieurs jours

### Classe de flux de travail

```

ts
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

###Configuration

```

jsonc
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

### Déclenchement des workflows

```

ts
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

### Options d'étape

```

ts
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

### En attente d'événements externes (Webhooks)

Les workflows peuvent suspendre l'exécution et attendre des événements externes tels que des webhooks de paiement, des flux d'approbation ou des rappels tiers.

```

ts
// src/workflows/payment.ts
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";

export class PaymentWorkflow extends WorkflowEntrypoint<Env, { userId: string }> {
  async run(event: WorkflowEvent<{ userId: string }>, step: WorkflowStep) {
    // Step 1: Create checkout session
    const session = await step.do("create stripe session", async () => {
      const stripe = new Stripe(this.env.STRIPE_SECRET_KEY);
      return await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: event.payload.email,
        success_url: `${this.env.APP_URL}/success`,
        cancel_url: `${this.env.APP_URL}/cancel`,
        metadata: { workflowId: event.instanceId },
      });
    });

    // Step 2: Wait for Stripe webhook (pauses execution)
    const stripeEvent = await step.waitForEvent("stripe.paid", {
      timeout: "24 hours",
    });

    // Step 3: Continue after payment confirmed
    await step.do("activate subscription", async () => {
      await this.env.DB.prepare(
        "UPDATE users SET subscription_status = 'active' WHERE id = ?"
      ).bind(event.payload.userId).run();
    });

    return { status: "completed", sessionId: session.id };
  }
}
```

**Webhook Handler (reçoit un événement externe et reprend le flux de travail) :**

```

ts
// src/routes/api/webhooks/stripe.ts
app.post("/api/webhooks/stripe", async (c) => {
  const sig = c.req.header("stripe-signature");
  const body = await c.req.text();

  const event = stripe.webhooks.constructEvent(
    body,
    sig!,
    c.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const workflowId = session.metadata?.workflowId;

    if (workflowId) {
      // Resume the waiting workflow
      const instance = await c.env.PAYMENT_WORKFLOW.get(workflowId);
      await instance.sendEvent({
        type: "stripe.paid",
        payload: { sessionId: session.id, customerId: session.customer },
      });
    }
  }

  return c.json({ received: true });
});
```

**Cas d'utilisation :**
- Confirmation de paiement (Stripe, Paddle)
- Flux de travail d'approbation humaine
- Rappels d'API tierces
- Flux de vérification des e-mails

### Bonnes pratiques

| Faire | Ne faites pas |
|----|-------|
| Un appel API par étape | Des pas de géant avec plusieurs appels |
| État de retour des étapes | Stocker l'état dans des variables en dehors des étapes |
| Utiliser des noms d'étapes déterministes | Noms dynamiques comme `step-${Date.now()}` |
| Stockez des données volumineuses dans R2, renvoyez les références | Renvoie 1 Mo+ à partir des étapes |

**Pour les agents IA avec appels d'outils :** Voir le modèle [Durable AI Agent](#durable-ai-agent-workflows--agents-sdk) combinant Workflows + Agents SDK.

---

## Files d'attente Cloudflare

Traitement des messages asynchrones avec livraison garantie au moins une fois.

### Quand l'utiliser

- Traitement des tâches en arrière-plan
- Mise en mémoire tampon API / limitation de débit
- Flux de travail pilotés par les événements
- Services de découplage

### Producteur (Envoyer des messages)

```

ts
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

### Consommateur (messages de processus)

```

ts
// src/workers/queue-consumer.ts
export default {
  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
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

type QueueMessage =
  | { type: "process-image"; imageId: string }
  | { type: "send-email"; to: string; subject: string };

async function processMessage(body: QueueMessage, env: Env) {
  switch (body.type) {
    case "process-image":
      await processImage(body.imageId, env);
      break;
    case "send-email":
      await sendEmail(body.to, body.subject);
      break;
  }
}
```

###Configuration

```

jsonc
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

### Commandes CLI

```

bash
wrangler queues create my-queue
wrangler queues create my-queue-dlq
wrangler queues consumer add my-queue my-worker
```

---

## Vectoriser (RAG)

Base de données vectorielles pour la recherche sémantique, les recommandations et les applications RAG.

### Installation

```

bash
# Create index (immutable after creation)
wrangler vectorize create doc-search --dimensions=768 --metric=cosine

# Create metadata indexes BEFORE inserting vectors
wrangler vectorize create-metadata-index doc-search --property-name=category --type=string
wrangler vectorize create-metadata-index doc-search --property-name=published --type=number
```

###Configuration

```

jsonc
// wrangler.jsonc
{
  "vectorize": [
    { "binding": "VECTORIZE", "index_name": "doc-search" }
  ],
  "ai": { "binding": "AI" }
}
```

### Indexation des documents

```

ts
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

### Modèle de requête RAG

```

ts
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

### Intégration de modèles

| Modèle | Dimensions | Idéal pour |
|-------|------------|--------------|
| `@cf/baai/bge-base-en-v1.5` | 768 | Texte anglais (équilibré) |
| `@cf/baai/bge-small-en-v1.5` | 384 | Rapide, précision moindre |
| `@cf/baai/bge-large-en-v1.5` | 1024 | Plus grande précision |

### Bonnes pratiques

- Créer des index de métadonnées AVANT d'insérer des vecteurs
- Utiliser `upsert` pour les mises à jour (l'insertion ignore les doublons)
- Insertions par lots : 1 000 à 2 500 vecteurs par lot
- Utilisez des espaces de noms pour l'isolation des locataires (plus rapide que les filtres de métadonnées)
- `returnMetadata: "indexed"` pour la vitesse, `"all"` en cas de besoin

---

## SDK des agents

Agents IA avec état avec mémoire persistante, WebSockets et planification.

> **Voir aussi :** Pour une matrice de décision complète entre les Workers, les Dynamic Workers et les conteneurs, voir [Cloudflare Compute](/fr/cloudflare-compute/).

### Quand l'utiliser

- Interfaces de discussion avec mémoire persistante
- IA collaborative en temps réel
- Workflows d'IA de longue durée
- État de l'IA par utilisateur

### Classe d'agent

```

ts
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

###Configuration

```

jsonc
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

### Utilisation

```

ts
// Get or create agent per user
const id = env.CHAT_AGENT.idFromName(`user-${userId}`);
const agent = env.CHAT_AGENT.get(id);

// Send message
const response = await agent.fetch(request);
```

### Prise en charge de WebSocket

```

ts
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

### Agent IA durable (Workflows + SDK Agents)

Combinez les workflows pour une exécution durable avec le SDK Agents pour des mises à jour de l'interface utilisateur en temps réel.

**Workflow avec appels d'outils :**

```

ts
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

**Agent pour les mises à jour en temps réel :**

```

ts
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

**Réagir au client :**

```

tsx
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

| Modèle | Cas d'utilisation |
|---------|----------|
| Flux de travail seul | Tâches en arrière-plan, aucune interface utilisateur nécessaire |
| Agent seul | Chat en temps réel, interactions courtes |
| Flux de travail + Agent | IA de longue durée avec progrès en temps réel |

---

##Configuration

### vite.config.ts

```

ts
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

### start.ts (Entrée)

```

ts
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

---

## Git Hooks (Husky + lint-staged)

Appliquez automatiquement la qualité du code à chaque commit et push. Le pré-commit exécute des vérifications rapides sur les fichiers intermédiaires uniquement ; le pré-push exécute le pipeline complet avant que le code n'atteigne le distant.

### Installer

```

bash
pnpm add -D husky lint-staged
pnpm exec husky init
```

### Racine `package.json

```

`json
{
  "scripts": {
    "lint": "oxlint .",
    "lint:fix": "oxlint --fix .",
    "fmt": "oxfmt .",
    "fmt:check": "oxfmt --check .",
    "typecheck": "tsgo --noEmit -p apps/web/tsconfig.json && tsgo --noEmit -p apps/server/tsconfig.json",
    "test": "turbo test",
    "build": "turbo build",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["oxfmt", "oxlint"],
    "*.{json,md,css}": ["oxfmt"]
  }
}
```

### `.husky/pre-commit

```

`bash
pnpm exec lint-staged
```

### `.husky/pre-push

```

`bash
pnpm typecheck && pnpm test && pnpm build
```

### Pourquoi cette scission

| Crochet | Fonctionne | Vitesse | Objectif |
|------|------|-------|---------|
| `pre-commit` | Sur les fichiers préparés uniquement | ~2s | Format + lint — boucle de rétroaction rapide |
| `pre-push` | Projet complet | ~30-60 ans | Types, tests, build – détecte les modifications avec rupture |

Le script `prepare` garantit que les hooks Husky sont installés automatiquement après le `pnpm install`.
