# Version Compatibility Matrix

This document specifies the recommended and tested versions for all technologies in the Fenod Stack.

**Last Updated:** November 2025

---

## Update Policy

- **Review Schedule:** Quarterly (January, April, July, October)
- **Major Updates:** Require ADR and team approval
- **Security Patches:** Applied immediately
- **Breaking Changes:** Coordinated across all projects

---

## Runtime & Package Managers

| Technology | Minimum Version | Recommended Version | Notes |
|------------|----------------|-------------------|-------|
| **Node.js** | 20.0.0 | 20.11.0 (LTS) | Required for local development |
| **Bun** | 1.0.0 | 1.1.30+ | Recommended for speed |
| **npm** | 10.0.0 | 10.8.0+ | Alternative to bun |
| **pnpm** | 9.0.0 | 9.12.0+ | Alternative to bun |

**Notes:**
- Use Node.js LTS for production stability
- Bun is fastest for local development
- pnpm recommended for monorepos (better than npm)

---

## Core Framework

| Package | Version | Notes |
|---------|---------|-------|
| **@tanstack/react-router** | ^1.58.0 | Core routing library |
| **@tanstack/start** | ^1.58.0 | Must match router version |
| **react** | ^18.3.0 | React 19 RC available but not recommended yet |
| **react-dom** | ^18.3.0 | Must match react version |
| **vite** | ^6.0.0 | Build tool |
| **@vitejs/plugin-react** | ^4.3.0 | Vite React plugin |

**Breaking Changes:**
- TanStack Start 1.x → 2.x will have breaking changes (TBD 2026)
- React 19 changes useEffect timing - wait for stable release

---

## Backend & API

| Package | Version | Notes |
|---------|---------|-------|
| **hono** | ^4.6.0 | Web framework |
| **@orpc/server** | ^0.1.0 | ORPC server (evolving API) |
| **@orpc/client** | ^0.1.0 | Must match server version |
| **zod** | ^3.23.0 | Schema validation |

**Notes:**
- ORPC is pre-1.0, expect minor breaking changes
- Pin exact versions in package.json for ORPC
- Hono 4.x is stable

---

## Database & ORM

| Package | Version | Notes |
|---------|---------|-------|
| **drizzle-orm** | ^0.36.0 | ORM library |
| **drizzle-kit** | ^0.28.0 | Migration tool |
| **drizzle-zod** | ^0.5.0 | Zod schema generation |
| **@cloudflare/workers-types** | ^4.20241127.0 | D1 types |

**Database Compatibility:**
- Cloudflare D1: SQLite 3.40+
- PostgreSQL: 14+, 15+, 16+ (recommended)
- MySQL: 8.0+

**Notes:**
- Drizzle releases frequently - test before upgrading
- Breaking changes between 0.x versions are common
- D1 is in open beta

---

## State Management

| Package | Version | Notes |
|---------|---------|-------|
| **@tanstack/react-query** | ^5.59.0 | Server state management |
| **@tanstack/react-query-devtools** | ^5.59.0 | Must match query version |

**Notes:**
- TanStack Query 5.x is current stable
- v4 → v5 migration required for breaking changes

---

## Authentication

| Package | Version | Notes |
|---------|---------|-------|
| **better-auth** | ^1.0.0 | Auth library |
| **@better-auth/drizzle** | ^1.0.0 | Drizzle adapter (optional) |

**Notes:**
- Better Auth reached 1.0 stable
- Check for security updates frequently

---

## Styling & UI

| Package | Version | Notes |
|---------|---------|-------|
| **tailwindcss** | ^4.0.0 | CSS framework (v4 - Oxide engine) |
| **@tailwindcss/vite** | ^4.0.0 | Vite plugin for Tailwind v4 |
| **class-variance-authority** | ^0.7.0 | Component variants |
| **clsx** | ^2.1.0 | Classname utility |
| **tailwind-merge** | ^2.5.0 | Merge Tailwind classes |
| **lucide-react** | ^0.460.0 | Icon library |

**shadcn/ui Components:**
- Components are copy-pasted, not versioned
- Update components manually from [ui.shadcn.com](https://ui.shadcn.com)
- Check component changelog before updating

**Notes:**
- Tailwind v4 is new - may have edge cases
- Can use Tailwind v3 if needed (stable alternative)

---

## Forms & Validation

| Package | Version | Notes |
|---------|---------|-------|
| **@tanstack/react-form** | ^0.33.0 | Form management |
| **zod** | ^3.23.0 | Runtime validation |

**Notes:**
- TanStack Form is pre-1.0, API may change
- Zod 3.x is stable

---

## File Upload

| Package | Version | Notes |
|---------|---------|-------|
| **better-upload** | ^0.1.0 | File upload library |

**Notes:**
- Pre-1.0, API may change
- Consider alternatives if stability needed

---

## Code Quality

| Package | Version | Notes |
|---------|---------|-------|
| **@biomejs/biome** | ^1.9.0 | Linter/formatter (used by Ultracite) |
| **ultracite** | ^6.0.0 | Biome preset |
| **typescript** | ^5.6.0 | Type checking |

**TypeScript Compatibility:**
- Drizzle requires TS 5.0+
- ORPC requires TS 5.0+
- TanStack Router requires TS 5.0+

**Notes:**
- Enable `strict: true` in tsconfig.json
- Use `moduleResolution: "bundler"` for best compatibility

---

## Testing

| Package | Version | Notes |
|---------|---------|-------|
| **vitest** | ^2.1.0 | Unit testing |
| **@testing-library/react** | ^16.0.0 | React testing utilities |
| **@testing-library/jest-dom** | ^6.6.0 | DOM matchers |
| **@playwright/test** | ^1.48.0 | E2E testing |

**Notes:**
- Vitest 2.x has breaking changes from v1
- Playwright updates frequently - check changelog

---

## Cloudflare Tooling

| Package | Version | Notes |
|---------|---------|-------|
| **wrangler** | ^3.84.0 | Cloudflare CLI |
| **@cloudflare/workers-types** | ^4.20241127.0 | TypeScript types |

**Notes:**
- Wrangler 3.x is current stable
- Update wrangler frequently for new D1/R2 features
- Check Cloudflare Workers changelog

---

## Monorepo Tools

| Package | Version | Notes |
|---------|---------|-------|
| **turbo** | ^2.2.0 | Turborepo build system |
| **concurrently** | ^9.0.0 | Run scripts in parallel |

**Notes:**
- Turbo 2.x is current stable
- Breaking changes from v1 → v2

---

## Compatibility Matrix

### Tested Combinations

✅ **Recommended Stack (as of Nov 2025)**

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tanstack/react-router": "^1.58.0",
    "@tanstack/start": "^1.58.0",
    "@tanstack/react-query": "^5.59.0",
    "@tanstack/react-form": "^0.33.0",
    "hono": "^4.6.5",
    "@orpc/server": "^0.1.0",
    "@orpc/client": "^0.1.0",
    "drizzle-orm": "^0.36.0",
    "better-auth": "^1.0.0",
    "zod": "^3.23.8",
    "tailwindcss": "^4.0.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.3",
    "vite": "^6.0.1",
    "typescript": "^5.6.3",
    "drizzle-kit": "^0.28.0",
    "wrangler": "^3.84.0",
    "@cloudflare/workers-types": "^4.20241127.0",
    "vitest": "^2.1.4",
    "@playwright/test": "^1.48.2",
    "ultracite": "^6.0.0"
  }
}
```

### Known Incompatibilities

❌ **Avoid These Combinations**

| Package A | Version | Package B | Version | Issue |
|-----------|---------|-----------|---------|-------|
| react | 19.x | @tanstack/react-router | <1.60.0 | useEffect timing issues |
| drizzle-orm | <0.30.0 | TypeScript | 5.5+ | Type inference breaks |
| wrangler | <3.0.0 | Cloudflare D1 | latest | D1 features missing |
| Tailwind | 3.x | @tailwindcss/vite | 4.x | Plugin mismatch |

---

## Version Pinning Strategy

### package.json Recommendations

```json
{
  "dependencies": {
    // Pin exact versions for pre-1.0 packages
    "@orpc/server": "0.1.0",
    "@orpc/client": "0.1.0",

    // Use caret (^) for stable packages
    "react": "^18.3.1",
    "hono": "^4.6.5",

    // Match major versions for coupled packages
    "@tanstack/react-router": "^1.58.0",
    "@tanstack/start": "^1.58.0"
  }
}
```

### Update Strategy

1. **Daily:** Check for security vulnerabilities
   ```bash
   npm audit
   # or
   bun audit
   ```

2. **Weekly:** Check for minor updates
   ```bash
   npx npm-check-updates
   ```

3. **Monthly:** Update dev dependencies
   ```bash
   npm update --save-dev
   ```

4. **Quarterly:** Review and update all dependencies
   - Test in staging environment first
   - Update documentation
   - Create migration guide if breaking changes

---

## Breaking Change Migration Guides

### React 18 → 19 (When Stable)

**Not recommended yet** - Wait for React 19 stable release

Key changes to prepare for:
- useEffect timing changes
- Ref cleanup behavior
- Automatic batching improvements

### TanStack Router 1.x → 2.x (TBD 2026)

Will be announced when ready. Expected changes:
- Route definition API updates
- Loader API changes

### Drizzle 0.x → 1.x (TBD)

Monitor for:
- Schema definition changes
- Query builder API updates
- Migration file format

---

## Security Updates

### Critical Packages to Monitor

1. **better-auth** - Authentication security
2. **hono** - Server security
3. **react** & **react-dom** - XSS vulnerabilities
4. **zod** - Validation bypasses
5. **@cloudflare/workers-types** - Runtime security

### Security Update Policy

- **Critical:** Update within 24 hours
- **High:** Update within 1 week
- **Medium:** Update in next sprint
- **Low:** Update in quarterly review

### Security Resources

- [Snyk Vulnerability Database](https://snyk.io/vuln/)
- [GitHub Security Advisories](https://github.com/advisories)
- [npm Security Advisories](https://www.npmjs.com/advisories)

---

## Deprecation Timeline

### Currently Supported

All technologies in the stack are actively supported.

### Watch List (May Deprecate)

None currently on deprecation watch.

### Deprecated (Do Not Use)

- ❌ **Tailwind CSS v2** - Use v3 or v4
- ❌ **TanStack Query v4** - Use v5
- ❌ **Wrangler v2** - Use v3

---

## Getting Help

**Version Issues?**
- Check [Troubleshooting Guide](troubleshooting.md)
- Search GitHub issues for the specific package
- Ask in project Discord/community

**Upgrade Questions?**
- Review package CHANGELOG
- Check migration guides
- Test in isolated environment first

---

**Next Review Date:** February 2026

---

**Maintained by:** Fenod Technical Team
