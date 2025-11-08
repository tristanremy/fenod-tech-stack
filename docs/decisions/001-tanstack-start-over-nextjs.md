# ADR-001: TanStack Start over Next.js

**Status:** Accepted

**Date:** October 2025

**Deciders:** Fenod Technical Team

---

## Context

We needed to choose a full-stack React framework for building modern web applications. The framework needed to support:

- Server-side rendering (SSR) and static site generation (SSG)
- Type-safe routing with TypeScript
- Edge runtime compatibility (Cloudflare Workers)
- File-based or code-based routing flexibility
- Minimal vendor lock-in
- Strong TypeScript support throughout

### Considered Alternatives

1. **Next.js** - Industry standard, largest ecosystem
2. **Remix** - Web standards focused, excellent DX
3. **TanStack Start** - New, built on TanStack Router
4. **Astro** - Content-focused, partial hydration

---

## Decision

We chose **TanStack Start** as our primary application framework.

---

## Rationale

### 1. **Type-Safe Routing**

TanStack Start provides end-to-end type safety for routing that surpasses Next.js App Router:

```tsx
// TanStack Start - fully typed params and search
export const Route = createFileRoute('/customers/$customerId')({
  loader: async ({ params }) => {
    // params.customerId is typed as string
    return getCustomer(params.customerId)
  }
})

// Next.js App Router - params are not typed
export async function generateMetadata({ params }: { params: { customerId: string } }) {
  // Must manually type params
}
```

### 2. **Framework Agnostic**

TanStack Start is built on TanStack Router, which is framework-agnostic and can work with any backend:

- Not tied to Vercel's ecosystem
- Can deploy anywhere (Cloudflare, Netlify, custom servers)
- Integrates with any API layer (REST, GraphQL, ORPC, tRPC)

Next.js is tightly coupled to Vercel's infrastructure and makes assumptions about your backend.

### 3. **Edge-First Architecture**

TanStack Start is designed for edge runtimes from the ground up:

- No Node.js-specific APIs
- Works perfectly with Cloudflare Workers
- Smaller bundle sizes (no Node polyfills needed)

Next.js has edge support but was originally built for Node.js, leading to compatibility issues.

### 4. **Simpler Mental Model**

TanStack Start uses a clearer separation of concerns:

- Routes are files
- Loaders fetch data
- Components render UI

Next.js App Router has complex concepts like Server Components, Client Components, and "use client" directives that can be confusing.

### 5. **Better Data Fetching Integration**

TanStack Start integrates seamlessly with TanStack Query:

```tsx
export const Route = createFileRoute('/dashboard')({
  loader: () => queryClient.ensureQueryData({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard
  }),
  component: Dashboard
})
```

This provides:
- Deduplication
- Background refetching
- Optimistic updates
- Consistent caching strategy

### 6. **No Vendor Lock-in**

- Open source with MIT license
- Not controlled by a commercial company
- Can migrate away more easily if needed
- Community-driven development

---

## Consequences

### Positive

✅ **Type Safety**: Compile-time guarantees for routing, params, and data loading

✅ **Flexibility**: Can use any backend, any deployment platform

✅ **Performance**: Smaller bundles, faster edge runtime execution

✅ **Learning Curve**: Simpler mental model, less magic

✅ **Cost**: No pressure to use expensive hosting (Vercel pricing)

✅ **Future-Proof**: Framework-agnostic core means less risk of framework churn

### Negative

❌ **Smaller Ecosystem**: Fewer third-party integrations and examples

❌ **Newer Framework**: Less battle-tested than Next.js

❌ **Hiring**: Fewer developers familiar with TanStack Start

❌ **Documentation**: Growing but not as extensive as Next.js

❌ **Image Optimization**: No built-in equivalent to next/image (use Cloudflare Images instead)

### Mitigations

1. **Ecosystem**: Use Cloudflare's extensive edge ecosystem
2. **Battle-Tested**: TanStack Router is mature; Start builds on proven foundation
3. **Hiring**: TanStack Router concepts are simpler to learn than Next.js App Router
4. **Documentation**: Official docs are excellent; community is active
5. **Images**: Cloudflare Images provides superior optimization and global delivery

---

## When Next.js Might Be Better

Consider Next.js if:

- You need Server Components for streaming HTML (though TanStack Start will add this)
- Your team has extensive Next.js expertise and no time to retrain
- You need specific Next.js integrations (though most can be replicated)
- You're already heavily invested in Vercel's ecosystem

---

## Implementation Notes

### Combining with Astro

For content-heavy sites requiring strong SEO, we recommend **Astro + TanStack Start**:

- Astro handles content pages (markdown, CMS content)
- TanStack Start handles interactive app features
- Best of both worlds: SEO + interactivity

Reference: [astro-tanstack-start](https://github.com/tannerlinsley/astro-tanstack-start)

### Migration Path

If you need to migrate from Next.js:

1. Routes map cleanly (pages/app directory → routes/)
2. Data fetching moves to loaders
3. API routes move to separate Hono backend
4. Middleware logic moves to ORPC procedures

---

## References

- [TanStack Start Docs](https://tanstack.com/start)
- [TanStack Router Docs](https://tanstack.com/router)
- [Why TanStack Router](https://tanstack.com/router/latest/docs/framework/react/comparison)
- [Edge Runtime Comparison](https://workers.cloudflare.com/works)

---

**Last Updated:** November 2025
