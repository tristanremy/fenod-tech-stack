# Guide Offline-First

[Available in English](../OFFLINE-FIRST-GUIDE.md)

> Retour au [README](../../README.md)

## Quand implémenter l'offline-first

| Contexte | Niveau recommandé |
| --- | --- |
| Site vitrine / marketing | Pas nécessaire |
| Dashboard admin | Cache basique |
| App métier terrain (artisans, techniciens) | Offline complet |
| Formulaires critiques (inventaires, rapports) | Offline complet |
| E-commerce catalogue | Cache basique |
| App avec paiements temps réel | Network-first obligatoire |

**Règle 80/20** : Implémenter l'offline-first uniquement si tes utilisateurs travaillent régulièrement en zone blanche ou avec connexion instable. Sinon, le cache TanStack Query suffit.

---

## Niveaux d'offline support

### Niveau 1 : Cache basique (TanStack Query persist)

Les données déjà chargées restent disponibles. Aucune action offline possible.

```bash
pnpm add @tanstack/query-sync-storage-persister @tanstack/react-query-persist-client
```

```typescript
// apps/web/src/utils/orpc.ts
import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      gcTime: 1000 * 60 * 60 * 24, // 24h - keep in cache
      retry: 1,
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

// Client-side only
if (typeof window !== "undefined") {
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
  });

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24, // 24h
  });
}
```

### Niveau 2 : Optimistic updates (UX fluide)

L'UI répond immédiatement, sync en background.

```typescript
// apps/web/src/hooks/use-todo-mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { toast } from "sonner";

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.todo.create.mutationOptions({
      onMutate: async (newTodo) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ["todo", "getAll"] });

        // Snapshot previous value
        const previous = queryClient.getQueryData(["todo", "getAll"]);

        // Optimistic update
        queryClient.setQueryData(["todo", "getAll"], (old: Todo[] = []) => [
          {
            id: `temp-${Date.now()}`,
            text: newTodo.text,
            completed: false,
            _optimistic: true,
          },
          ...old,
        ]);

        return { previous };
      },

      onError: (err, _newTodo, context) => {
        // Rollback on error
        if (context?.previous) {
          queryClient.setQueryData(["todo", "getAll"], context.previous);
        }
        toast.error("Échec de la création");
      },

      onSuccess: () => {
        toast.success("Tâche créée");
      },

      onSettled: () => {
        // Always refetch after error or success
        queryClient.invalidateQueries({ queryKey: ["todo", "getAll"] });
      },
    })
  );
}
```

### Niveau 3 : Offline complet (IndexedDB + sync queue)

Actions possibles sans réseau, synchronisation automatique au retour online.

---

## Architecture Offline Complet

```
┌─────────────────────────────────────────────────────────┐
│                        UI                                │
├─────────────────────────────────────────────────────────┤
│                  TanStack Query                          │
│              (cache + optimistic updates)                │
├─────────────────────────────────────────────────────────┤
│                   IndexedDB                              │
│         (données locales + queue d'actions)              │
├─────────────────────────────────────────────────────────┤
│                  Sync Manager                            │
│          (détecte online, replay actions)                │
├─────────────────────────────────────────────────────────┤
│                  Service Worker                          │
│            (cache assets + API fallback)                 │
├─────────────────────────────────────────────────────────┤
│                    Network                               │
│               (ORPC → Hono → D1)                         │
└─────────────────────────────────────────────────────────┘
```

---

## Implémentation

### 1. IndexedDB Store

```bash
pnpm add idb
```

```typescript
// apps/web/src/lib/offline-db.ts
import { openDB, type IDBPDatabase } from "idb";

export interface OfflineAction {
  id: string;
  type: "create" | "update" | "delete";
  table: string;
  payload: unknown;
  timestamp: number;
  retries: number;
}

export interface OfflineDB {
  todos: {
    key: string;
    value: {
      id: string;
      text: string;
      completed: boolean;
      _localOnly?: boolean;
      _deleted?: boolean;
    };
  };
  pendingActions: {
    key: string;
    value: OfflineAction;
    indexes: { "by-timestamp": number };
  };
}

let dbInstance: IDBPDatabase<OfflineDB> | null = null;

export async function getOfflineDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDB>("app-offline-db", 1, {
    upgrade(db) {
      // Local data store
      if (!db.objectStoreNames.contains("todos")) {
        db.createObjectStore("todos", { keyPath: "id" });
      }

      // Pending actions queue
      if (!db.objectStoreNames.contains("pendingActions")) {
        const store = db.createObjectStore("pendingActions", { keyPath: "id" });
        store.createIndex("by-timestamp", "timestamp");
      }
    },
  });

  return dbInstance;
}

// Queue an action for later sync
export async function queueAction(
  type: OfflineAction["type"],
  table: string,
  payload: unknown
) {
  const db = await getOfflineDB();
  const action: OfflineAction = {
    id: crypto.randomUUID(),
    type,
    table,
    payload,
    timestamp: Date.now(),
    retries: 0,
  };
  await db.add("pendingActions", action);
  return action;
}

// Get all pending actions in order
export async function getPendingActions(): Promise<OfflineAction[]> {
  const db = await getOfflineDB();
  return db.getAllFromIndex("pendingActions", "by-timestamp");
}

// Remove synced action
export async function removeAction(id: string) {
  const db = await getOfflineDB();
  await db.delete("pendingActions", id);
}

// Increment retry count
export async function incrementRetry(id: string) {
  const db = await getOfflineDB();
  const action = await db.get("pendingActions", id);
  if (action) {
    action.retries += 1;
    await db.put("pendingActions", action);
  }
}
```

### 2. Sync Manager

```typescript
// apps/web/src/lib/sync-manager.ts
import { getPendingActions, removeAction, incrementRetry } from "./offline-db";
import { orpc } from "@/utils/orpc";

const MAX_RETRIES = 3;

type SyncHandler = (payload: unknown) => Promise<void>;

const syncHandlers: Record<string, Record<string, SyncHandler>> = {
  todos: {
    create: async (payload) => {
      const { text } = payload as { text: string };
      await orpc.todo.create.mutate({ text });
    },
    update: async (payload) => {
      const { id, completed } = payload as { id: number; completed: boolean };
      await orpc.todo.toggle.mutate({ id, completed });
    },
    delete: async (payload) => {
      const { id } = payload as { id: number };
      await orpc.todo.delete.mutate({ id });
    },
  },
};

export async function syncPendingActions(): Promise<{
  synced: number;
  failed: number;
}> {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const actions = await getPendingActions();
  let synced = 0;
  let failed = 0;

  for (const action of actions) {
    const handler = syncHandlers[action.table]?.[action.type];

    if (!handler) {
      console.warn(`No sync handler for ${action.table}.${action.type}`);
      await removeAction(action.id);
      continue;
    }

    try {
      await handler(action.payload);
      await removeAction(action.id);
      synced++;
    } catch (error) {
      console.error(`Sync failed for action ${action.id}:`, error);

      if (action.retries >= MAX_RETRIES) {
        // Give up after max retries - could notify user here
        await removeAction(action.id);
        failed++;
      } else {
        await incrementRetry(action.id);
        failed++;
      }
    }
  }

  return { synced, failed };
}

// Auto-sync on reconnect
export function initSyncManager() {
  if (typeof window === "undefined") return;

  window.addEventListener("online", async () => {
    console.log("Back online, syncing...");
    const result = await syncPendingActions();
    console.log(`Synced: ${result.synced}, Failed: ${result.failed}`);
  });

  // Also try to sync on app start
  if (navigator.onLine) {
    syncPendingActions();
  }
}
```

### 3. Online Status Hook

```typescript
// apps/web/src/hooks/use-online-status.ts
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true; // Assume online during SSR
}

export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

### 4. Offline Indicator Component

```typescript
// apps/web/src/components/offline-indicator.tsx
"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      <span>Mode hors ligne — Les modifications seront synchronisées au retour de la connexion</span>
    </div>
  );
}
```

### 5. Offline-aware Mutation Hook

```typescript
// apps/web/src/hooks/use-offline-mutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queueAction } from "@/lib/offline-db";
import { useOnlineStatus } from "./use-online-status";
import { toast } from "sonner";

interface OfflineMutationOptions<TData, TVariables> {
  table: string;
  actionType: "create" | "update" | "delete";
  onlineMutationFn: (variables: TVariables) => Promise<TData>;
  optimisticUpdate?: (variables: TVariables) => void;
  queryKey: unknown[];
}

export function useOfflineMutation<TData, TVariables>({
  table,
  actionType,
  onlineMutationFn,
  optimisticUpdate,
  queryKey,
}: OfflineMutationOptions<TData, TVariables>) {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      if (isOnline) {
        return onlineMutationFn(variables);
      }

      // Queue for later sync
      await queueAction(actionType, table, variables);
      toast.info("Action enregistrée, sera synchronisée en ligne");
      return null as TData;
    },

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      if (optimisticUpdate) {
        optimisticUpdate(variables);
      }

      return { previous };
    },

    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error("Erreur lors de l'opération");
    },

    onSettled: () => {
      if (isOnline) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
```

---

## PWA Setup

### vite-plugin-pwa (recommandé)

```bash
pnpm add -D vite-plugin-pwa
```

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    // ... autres plugins
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "icons/*.svg"],

      manifest: {
        name: "Mon Application",
        short_name: "MonApp",
        description: "Application métier offline-first",
        theme_color: "#3b82f6",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],

        runtimeCaching: [
          // API calls - Network first, fallback to cache
          {
            urlPattern: /\/rpc\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24h
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Images - Cache first
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Fonts - Cache first
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
  ],
});
```

### Icônes PWA minimales

Crée au minimum ces fichiers dans `public/icons/` :

```
public/
├── icons/
│   ├── icon-192.png   # 192x192px
│   ├── icon-512.png   # 512x512px
│   └── icon-512-maskable.png  # 512x512px avec safe zone
├── favicon.ico
└── robots.txt
```

**Tip** : Utilise [PWA Asset Generator](https://github.com/nickytonline/pwa-asset-generator) ou [Maskable.app](https://maskable.app/) pour générer les icônes.

---

## Caching Strategies

### Quand utiliser chaque stratégie

| Stratégie | Utilisation | Exemple |
|-----------|-------------|---------|
| **Cache First** | Assets statiques, rarement modifiés | Fonts, images, CSS, JS bundles |
| **Network First** | Données fraîches importantes, fallback acceptable | API calls, user data |
| **Stale While Revalidate** | Données fréquemment accédées, fraîcheur moins critique | Liste de produits, articles |
| **Network Only** | Données temps réel critiques | Paiements, transactions |
| **Cache Only** | Assets précachés uniquement | App shell, offline page |

### Workbox Strategies en détail

```typescript
// Cache First - Rapide, utilise le cache en priorité
{
  urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
  handler: "CacheFirst",
  options: {
    cacheName: "images",
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
    },
  },
}

// Network First - Frais, fallback sur cache si offline
{
  urlPattern: /\/api\/.*/,
  handler: "NetworkFirst",
  options: {
    cacheName: "api",
    networkTimeoutSeconds: 10,
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 24 * 60 * 60, // 24h
    },
  },
}

// Stale While Revalidate - Rapide ET frais (en background)
{
  urlPattern: /\/api\/products/,
  handler: "StaleWhileRevalidate",
  options: {
    cacheName: "products",
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 60, // 1h
    },
  },
}
```

---

## Testing Offline

### Chrome DevTools

1. Ouvrir DevTools (F12)
2. Tab "Network"
3. Cocher "Offline" dans le dropdown throttling
4. Tester l'app

### Script de test

```typescript
// Pour tester en dev
export function simulateOffline(durationMs: number = 5000) {
  const originalFetch = window.fetch;

  window.fetch = () => Promise.reject(new Error("Simulated offline"));

  setTimeout(() => {
    window.fetch = originalFetch;
    window.dispatchEvent(new Event("online"));
  }, durationMs);

  window.dispatchEvent(new Event("offline"));
}
```

---

## Checklist Déploiement

- [ ] Manifest valide (`/manifest.webmanifest`)
- [ ] Service worker enregistré
- [ ] Icônes 192px et 512px présentes
- [ ] HTTPS activé (obligatoire pour PWA)
- [ ] `start_url` accessible offline
- [ ] Lighthouse PWA score > 90

### Commandes de test

```bash
# Build production
pnpm build

# Serve localement (simule prod)
pnpm preview

# Audit Lighthouse
npx lighthouse http://localhost:4173 --view
```

---

## Patterns Avancés

### Conflict Resolution

Pour les cas où le même item est modifié offline sur plusieurs devices :

```typescript
// Stratégie "Last Write Wins" simple
interface SyncableItem {
  id: string;
  updatedAt: number; // timestamp
  _version: number;
}

async function resolveConflict(local: SyncableItem, remote: SyncableItem) {
  // Le plus récent gagne
  return local.updatedAt > remote.updatedAt ? local : remote;
}
```

### Background Sync API (si supporté)

```typescript
// Service worker - sync tag
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-actions") {
    event.waitUntil(syncPendingActions());
  }
});

// Client - request sync
async function requestBackgroundSync() {
  if ("serviceWorker" in navigator && "sync" in ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register("sync-pending-actions");
  }
}
```

### Quota Storage

```typescript
// Vérifier l'espace disponible
async function checkStorageQuota() {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const { usage, quota } = await navigator.storage.estimate();
    const percentUsed = ((usage || 0) / (quota || 1)) * 100;
    console.log(`Storage: ${percentUsed.toFixed(2)}% used`);

    if (percentUsed > 80) {
      // Cleanup old cached data
      await cleanupOldCache();
    }
  }
}
```

### IndexedDB Persister (Alternative à localStorage)

Pour des données plus volumineuses, utilise IndexedDB au lieu de localStorage :

```typescript
// apps/web/src/lib/idb-persister.ts
import { get, set, del } from "idb-keyval";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

export function createIDBPersister(idbValidKey: IDBValidKey = "reactQuery"): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(idbValidKey, client);
    },
    restoreClient: async () => {
      return await get<PersistedClient>(idbValidKey);
    },
    removeClient: async () => {
      await del(idbValidKey);
    },
  };
}
```

Usage :

```typescript
import { createIDBPersister } from "@/lib/idb-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

const persister = createIDBPersister();

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      {/* ... */}
    </PersistQueryClientProvider>
  );
}
```

---

## Pièges courants

| Piège | Solution |
|-------|----------|
| localStorage limité à ~5MB | Utiliser IndexedDB pour données volumineuses |
| Service worker cache stale | Implémenter versioning et update prompt |
| Mutations perdues au reload | Persister la mutation queue dans IndexedDB |
| Conflits de données | Implémenter Last-Write-Wins ou merge strategy |
| Cache jamais invalidé | Configurer `maxAge` et `maxEntries` appropriés |
| SSR hydration mismatch | Créer persister uniquement côté client |

---

## Ressources

- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [IndexedDB API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [TanStack Query Persistence](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient)
- [web.dev PWA Guide](https://web.dev/learn/pwa/)
- [Background Sync API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
