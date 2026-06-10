---
title: "Débogage"
verified: 2026-06
---

[Available in English](/fr/debugging/)

## Chrome DevTools MCP

Utilisez [chrome-devtools-mcp](https://github.com/anthropics/anthropic-quickstarts/tree/main/mcp-chrome-devtools) pour laisser Claude inspecter directement l'état du navigateur.

```bash
# Install
pnpm dlx @anthropic-ai/chrome-devtools-mcp
```

Claude peut alors :
- Inspecter les journaux/erreurs de la console
- Afficher les demandes de réseau
- Lire l'état du DOM
- Vérifiez le stockage local/les cookies
- Déboguer l'état du composant React

## Cloudflare

### Wrangler Tail (journaux en direct)

```

bash
# Stream live logs from Workers
wrangler tail

# Filter by status
wrangler tail --status error

# Filter by search term
wrangler tail --search "userId"

# JSON output for parsing
wrangler tail --format json
```

### Débogage D1

```

bash
# Query D1 directly
wrangler d1 execute DB_NAME --command "SELECT * FROM users LIMIT 5"

# Export for inspection
wrangler d1 export DB_NAME --output dump.sql

# Local D1 (dev)
wrangler d1 execute DB_NAME --local --command "SELECT * FROM users"
```

### Journaux des travailleurs (tableau de bord)

`dash.cloudflare.com` → Travailleurs → Votre travailleur → Journaux

- Flux de journaux en temps réel
- Filtrer par heure/statut
- Demander des traces avec timing

## Hono

### Middleware de journalisation des demandes

```

ts
import { logger } from "hono/logger";

app.use("*", logger());
```

### Middleware de débogage personnalisé

```

ts
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  console.log(`${c.req.method} ${c.req.path} - ${c.res.status} (${Date.now() - start}ms)`);
});
```

### Gestion des erreurs

```

ts
app.onError((err, c) => {
  console.error(`${c.req.method} ${c.req.path}:`, err);
  return c.json({ error: err.message }, 500);
});
```

## Bruine

### Journalisation des requêtes

```

ts
import { drizzle } from "drizzle-orm/d1";

const db = drizzle(env.DB, {
  logger: true // logs all queries
});
```

### Enregistreur personnalisé

```

ts
const db = drizzle(env.DB, {
  logger: {
    logQuery(query, params) {
      console.log("Query:", query);
      console.log("Params:", params);
    },
  },
});
```

## Requête TanStack

### Outils de développement

```

tsx
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

### Journalisation des requêtes

```

ts
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

## Meilleure authentification

### Mode débogage

```

ts
export const auth = betterAuth({
  logger: {
    disabled: false,
    level: "debug", // error | warn | info | debug
  },
});
```

### Inspection de session

```

ts
// Server-side
const session = await auth.api.getSession({ headers });
console.log("Session:", session);

// Client-side
const { data } = authClient.useSession();
console.log("Client session:", data);
```

## Débogage du réseau

### Récupérer l'intercepteur (client)

```

ts
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log("Fetch:", args[0]);
  const res = await originalFetch(...args);
  console.log("Response:", res.status);
  return res;
};
```

## Conseils environnementaux

```

bash
# Local dev with remote D1
wrangler dev --remote

# Local dev with local D1
wrangler dev --local

# Check bindings
wrangler whoami
wrangler d1 list
```
