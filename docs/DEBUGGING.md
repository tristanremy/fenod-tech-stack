# Debugging

[Disponible en français](./fr/DEBUGGING.md)

## Chrome DevTools MCP

Use [chrome-devtools-mcp](https://github.com/anthropics/anthropic-quickstarts/tree/main/mcp-chrome-devtools) to let Claude inspect browser state directly.

```bash
# Install
npx @anthropic-ai/chrome-devtools-mcp
```

Claude can then:
- Inspect console logs/errors
- View network requests
- Read DOM state
- Check localStorage/cookies
- Debug React component state

## Cloudflare

### Wrangler Tail (Live Logs)

```bash
# Stream live logs from Workers
wrangler tail

# Filter by status
wrangler tail --status error

# Filter by search term
wrangler tail --search "userId"

# JSON output for parsing
wrangler tail --format json
```

### D1 Debugging

```bash
# Query D1 directly
wrangler d1 execute DB_NAME --command "SELECT * FROM users LIMIT 5"

# Export for inspection
wrangler d1 export DB_NAME --output dump.sql

# Local D1 (dev)
wrangler d1 execute DB_NAME --local --command "SELECT * FROM users"
```

### Workers Logs (Dashboard)

`dash.cloudflare.com` → Workers → Your Worker → Logs

- Real-time log stream
- Filter by time/status
- Request traces with timing

## Hono

### Request Logging Middleware

```ts
import { logger } from "hono/logger";

app.use("*", logger());
```

### Custom Debug Middleware

```ts
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  console.log(`${c.req.method} ${c.req.path} - ${c.res.status} (${Date.now() - start}ms)`);
});
```

### Error Handling

```ts
app.onError((err, c) => {
  console.error(`${c.req.method} ${c.req.path}:`, err);
  return c.json({ error: err.message }, 500);
});
```

## Drizzle

### Query Logging

```ts
import { drizzle } from "drizzle-orm/d1";

const db = drizzle(env.DB, {
  logger: true // logs all queries
});
```

### Custom Logger

```ts
const db = drizzle(env.DB, {
  logger: {
    logQuery(query, params) {
      console.log("Query:", query);
      console.log("Params:", params);
    },
  },
});
```

## TanStack Query

### DevTools

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Query Logging

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (err) => console.error("Query error:", err),
    },
    mutations: {
      onError: (err) => console.error("Mutation error:", err),
    },
  },
});
```

## Better Auth

### Debug Mode

```ts
export const auth = betterAuth({
  logger: {
    disabled: false,
    level: "debug", // error | warn | info | debug
  },
});
```

### Session Inspection

```ts
// Server-side
const session = await auth.api.getSession({ headers });
console.log("Session:", session);

// Client-side
const { data } = authClient.useSession();
console.log("Client session:", data);
```

## Network Debugging

### Fetch Interceptor (Client)

```ts
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log("Fetch:", args[0]);
  const res = await originalFetch(...args);
  console.log("Response:", res.status);
  return res;
};
```

## Environment Tips

```bash
# Local dev with remote D1
wrangler dev --remote

# Local dev with local D1
wrangler dev --local

# Check bindings
wrangler whoami
wrangler d1 list
```
