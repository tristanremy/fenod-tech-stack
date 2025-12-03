# Fenod Stack

> [Development Strategy](docs/development-strategy.md) | [Debugging](docs/debugging.md) | [MCP Guide](docs/mcp-guide.md) | [Astro SEO](docs/astro-seo-guide.md)

## Decision Matrix

| Need | Stack | Deploy |
|------|-------|--------|
| Full-stack app | TanStack Start + Hono + ORPC + Drizzle + D1 + Better Auth | CF Workers |
| Content + SEO | Astro + TanStack Start | CF Pages |
| SPA (no SEO) | TanStack Start | CF Workers |
| API only | Hono + ORPC + Drizzle | CF Workers |
| Docs site | Starlight | CF Pages |
| Monorepo | Add Turborepo to any above | - |

## Bootstrap

```bash
pnpm create better-t-stack@latest
```

Visual builder: [better-t-stack.dev/new](https://better-t-stack.dev/new)

## Cloudflare Services

| Service | Use |
|---------|-----|
| Workers | Serverless compute |
| Pages | Static sites |
| D1 | SQLite database |
| R2 | Object storage |
| KV | Key-value store |
| Images | Image optimization |

Deploy with [Alchemy](https://alchemy.run)

## API Pattern (Hono + ORPC + Drizzle)

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/d1";

type Bindings = { DB: D1Database };

const app = new Hono<{ Bindings: Bindings }>();

app.use("/*", cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.get("/api/items", async (c) => {
  const db = drizzle(c.env.DB);
  const items = await db.select().from(schema.items);
  return c.json(items);
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

### Client Setup

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.API_URL,
  fetchOptions: {
    credentials: "include",
    onError: (ctx) => {
      if (ctx.response.status === 429) {
        const retry = ctx.response.headers.get("X-Retry-After");
        toast.error(`Rate limited. Retry in ${retry}s`);
      }
    },
  },
});

// Sign up
await authClient.signUp.email({ name, email, password });

// Sign in
await authClient.signIn.email({ email, password, rememberMe: true });

// Get session
const { data: session } = await authClient.getSession();
const { data: session } = authClient.useSession(); // reactive

// Password reset
await authClient.requestPasswordReset({ email, redirectTo: "/reset" });
await authClient.resetPassword({ newPassword, token });

// Session management
await authClient.listSessions();
await authClient.revokeSession({ id });
await authClient.revokeOtherSessions();

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
| Start | Full-stack React framework |
| Query | Server state, caching, optimistic updates |
| Router | Type-safe routing (included in Start) |
| Form | Type-safe forms with validation |
| Table | Headless data tables |

## Tools

| Tool | Use |
|------|-----|
| Tailwind v4 | Styling |
| Turborepo | Monorepo builds |
| Ultracite | Linting (Biome-based) |
| Better Upload | File uploads to R2 |
| Polar.sh | Payments |
| AI SDK | LLM integration |
| AI SDK Elements | Chat UI components |

## Links

**Core:** [TanStack Start](https://tanstack.com/start) | [Astro](https://astro.build) | [Hono](https://hono.dev) | [ORPC](https://orpc.unnoq.com) | [Drizzle](https://orm.drizzle.team) | [Better Auth](https://better-auth.com)

**Infra:** [Cloudflare](https://developers.cloudflare.com) | [Alchemy](https://alchemy.run) | [Turborepo](https://turbo.build)

**UI:** [shadcn/ui](https://ui.shadcn.com) | [Tailwind](https://tailwindcss.com) | [AI SDK Elements](https://ai-sdk.dev/elements)

**Tools:** [Better Upload](https://better-upload.dev) | [Polar.sh](https://polar.sh) | [AI SDK](https://sdk.vercel.ai) | [Ultracite](https://github.com/haydenbleasel/ultracite) | [Starlight](https://starlight.astro.build)
