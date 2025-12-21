# OpenCode Monorepo Audit & Improvement Prompt

## Context

Tu audites un monorepo TypeScript full-stack avec la stack suivante :

**Core Stack:**
- TanStack Start (frontend React full-stack)
- Hono (backend API)
- ORPC (type-safe RPC, alternative à tRPC)
- Drizzle ORM + Cloudflare D1 (SQLite)
- Better Auth (authentication)
- Zod (validation)

**Infrastructure:**
- Cloudflare Workers/Pages (compute)
- Cloudflare D1, R2, KV (storage)
- Turborepo (monorepo orchestration)
- Alchemy (deployment)

**UI/Tooling:**
- Tailwind v4 + shadcn/ui
- Ultracite (Biome-based linting)
- pnpm workspaces

**Structure attendue:**
```
apps/
  web/          # TanStack Start frontend
  server/       # Hono + ORPC backend
packages/
  api/          # ORPC router definitions
  auth/         # Better Auth config
  db/           # Drizzle schemas + migrations
  config/       # Shared TypeScript/ESLint config
  ui/           # Shared components (optionnel)
```

---

## Mission

Analyse le repo complet et produis un rapport actionnable avec des fixes concrets. Priorise par impact/effort (80/20).

---

## 1. SÉCURITÉ

### 1.1 Authentication & Authorization
- [ ] Vérifier que Better Auth est configuré avec `cookieCache` activé (JWE strategy)
- [ ] Vérifier les rate limits sur `/sign-in/*`, `/two-factor/*`, `/forgot-password/*`
- [ ] S'assurer que `requireEmailVerification: true` est activé en prod
- [ ] Vérifier que les routes protégées utilisent `protectedProcedure` côté ORPC
- [ ] Vérifier le middleware auth TanStack Start (`beforeLoad` + redirect)
- [ ] Chercher des routes/endpoints sans protection qui devraient en avoir

### 1.2 Input Validation
- [ ] Tous les inputs ORPC doivent avoir un schema Zod (`.input(z.object({...}))`)
- [ ] Vérifier la validation des fichiers uploadés (type, taille, extension)
- [ ] Chercher des `any` ou `unknown` non validés
- [ ] Vérifier les query params et path params

### 1.3 Secrets & Config
- [ ] Aucun secret hardcodé (chercher patterns: `sk_`, `pk_`, `Bearer`, API keys)
- [ ] `.env.example` présent et à jour
- [ ] Secrets Cloudflare via `wrangler secret` ou Alchemy secrets
- [ ] Vérifier que `.env*` est dans `.gitignore`

### 1.4 Headers & CORS
- [ ] CORS correctement configuré (origin strict, pas de `*` en prod)
- [ ] Headers de sécurité présents (CSP, X-Frame-Options, etc.)
- [ ] `credentials: true` uniquement si nécessaire

### 1.5 Database Security
- [ ] Pas de raw SQL sans parameterized queries
- [ ] Vérifier les `onDelete: "cascade"` sont intentionnels
- [ ] Indexes sur les foreign keys et colonnes de recherche fréquentes

---

## 2. PERFORMANCE

### 2.1 Database & Queries
- [ ] Éviter les N+1 queries (utiliser `with` de Drizzle pour les relations)
- [ ] Indexes manquants sur colonnes de filtre/tri fréquentes
- [ ] Pagination sur toutes les listes (`.limit()`, `.offset()` ou cursor-based)
- [ ] Sélection de colonnes spécifiques vs `SELECT *`

### 2.2 Caching
- [ ] TanStack Query `staleTime` configuré (recommandé: 60s minimum)
- [ ] Better Auth `cookieCache` activé pour éviter DB hits
- [ ] Headers Cache-Control sur assets statiques
- [ ] Utilisation de KV pour cache applicatif si pertinent

### 2.3 Bundle & Loading
- [ ] Code splitting par route (TanStack Start le fait par défaut, vérifier)
- [ ] Lazy loading des composants lourds (`React.lazy`)
- [ ] Images optimisées (Cloudflare Images ou format moderne)
- [ ] Tree-shaking effectif (pas d'imports barrel inutiles)

### 2.4 API Performance
- [ ] Endpoints qui pourraient être combinés (réduire les round-trips)
- [ ] Utilisation de `prefetch` TanStack Router pour les routes probables
- [ ] Server functions vs API calls (préférer server functions quand possible)

### 2.5 Cloudflare-specific
- [ ] Workers: éviter les imports dynamiques au runtime
- [ ] D1: batch les writes quand possible
- [ ] R2: utiliser des presigned URLs pour les uploads directs

---

## 3. MUTUALISATION & NON-REDONDANCE

### 3.1 Packages partagés
- [ ] Types partagés dans `packages/api` ou `packages/shared`
- [ ] Schémas Zod réutilisés entre frontend et backend
- [ ] Schémas Drizzle exportés et utilisés pour l'inférence de types
- [ ] Config TypeScript étendue depuis `packages/config`

### 3.2 Code dupliqué
- [ ] Chercher les fonctions utilitaires dupliquées entre apps
- [ ] Composants UI dupliqués → créer `packages/ui`
- [ ] Hooks React dupliqués → mutualiser
- [ ] Constantes/enums dupliquées

### 3.3 Patterns à mutualiser
```typescript
// packages/api/src/utils/pagination.ts
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// packages/db/src/utils/timestamps.ts
export const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$onUpdate(() => new Date())
    .notNull(),
};
```

### 3.4 DRY violations courantes
- [ ] Error handling répété → créer un wrapper/utility
- [ ] Toast notifications → créer un service centralisé
- [ ] Form patterns répétés → créer des composants de form réutilisables
- [ ] Loading states → standardiser avec un pattern uniforme

---

## 4. BONNES PRATIQUES 2025

### 4.1 TypeScript strict
- [ ] `"strict": true` dans tsconfig
- [ ] Pas de `any` (chercher et fixer)
- [ ] Pas de `@ts-ignore` ou `@ts-expect-error` injustifiés
- [ ] Inférence de types Drizzle utilisée (`typeof schema.$inferSelect`)

### 4.2 Structure ORPC
```typescript
// ✅ Bonne structure
// packages/api/src/routers/user.ts
export const userRouter = {
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      // ...
    }),
};

// ✅ Context typé
// packages/api/src/context.ts
export type Context = {
  session: Session | null;
  db: DrizzleD1Database;
};
```

### 4.3 Error handling
```typescript
// ✅ Utiliser ORPCError avec codes standards
import { ORPCError } from "@orpc/server";

throw new ORPCError("NOT_FOUND", "User not found");
throw new ORPCError("FORBIDDEN", "Access denied");
throw new ORPCError("BAD_REQUEST", "Invalid input");
```

### 4.4 File structure conventions
- [ ] Un fichier = un export principal
- [ ] Index files pour les re-exports publics uniquement
- [ ] Colocation: tests à côté des fichiers qu'ils testent
- [ ] Naming: `kebab-case` pour fichiers, `PascalCase` pour composants

### 4.5 Modern patterns
- [ ] Server Components quand possible (TanStack Start SSR)
- [ ] Optimistic updates avec TanStack Query
- [ ] Form validation côté client ET serveur
- [ ] Feature flags prêts (structure pour activation progressive)

### 4.6 Observability ready
- [ ] Structured logging (pas de `console.log` en prod)
- [ ] Error boundaries React en place
- [ ] Health check endpoint (`/health` ou `/api/health`)

---

## 5. CHECKLIST TURBOREPO

### 5.1 turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", ".vinxi/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

### 5.2 Workspace dependencies
- [ ] Utiliser `workspace:*` pour les packages internes
- [ ] Versions des dépendances externes alignées (utiliser `syncpack`)
- [ ] Pas de dépendances circulaires entre packages

---

## 6. OUTPUT ATTENDU

Pour chaque issue trouvée, fournis :

```markdown
### [CATEGORY] Issue title

**Severity:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low
**Effort:** S (< 30min) | M (1-4h) | L (> 4h)
**File(s):** `path/to/file.ts`

**Problem:**
Description concise du problème.

**Fix:**
\`\`\`typescript
// Code corrigé
\`\`\`

**Why:**
Impact sur sécurité/perf/maintenabilité.
```

---

## 7. PRIORISATION

Commence par :
1. 🔴 Failles de sécurité critiques
2. 🟠 Issues de perf à fort impact
3. 🟡 Quick wins de mutualisation (< 30min, impact élevé)
4. 🟢 Améliorations de DX et maintenabilité

---

## 8. COMMANDES UTILES

```bash
# Analyser les dépendances
pnpm why <package>

# Trouver le code dupliqué
npx jscpd ./apps ./packages --min-lines 5 --min-tokens 50

# Analyser le bundle
pnpm --filter web build && npx source-map-explorer dist/**/*.js

# Vérifier les types
pnpm turbo typecheck

# Linter
pnpm turbo lint
```

---

## Notes

- Ne propose PAS de migration vers une autre stack
- Focus sur l'amélioration de l'existant
- Propose des fixes concrets avec du code
- Priorise 80/20 : les 20% de fixes qui apportent 80% de valeur
