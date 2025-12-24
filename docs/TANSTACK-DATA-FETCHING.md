# TanStack Data Fetching: Query vs Router Loaders

> With TanStack Router/Start, React Query becomes **optional** for read-only data. Use loaders for simplicity, Query for reactivity.

---

## Decision Matrix

| Data Type | Use | Why |
|-----------|-----|-----|
| **Stable/Static** | Router `loader` | Blog posts, product pages, profiles — rarely changes. Built-in loading/error states. |
| **Dynamic/Mutable** | React Query | Editors, real-time feeds, collaborative data — needs cache invalidation, optimistic updates, refetching. |
| **Hybrid** | Both | Loader for initial fetch, Query for mutations/revalidation. |

---

## Quick Decision Flow

```
Is this data mutated frequently?
  → YES → React Query
  → NO  → Does it need background refetching?
            → YES → React Query
            → NO  → Router loader
```

---

## Patterns

### 1. Loader Only (Stable Data)

Best for: blog posts, static pages, product details

```tsx
export const Route = createFileRoute('/post/$id')({
  loader: ({ params }) => fetchPost(params.id),
  component: PostPage,
})

function PostPage() {
  const post = Route.useLoaderData()
  return <article>{post.content}</article>
}
```

**Pros:** Simple, built-in loading/error states, SSR-friendly  
**Cons:** No automatic revalidation, no optimistic updates

### 2. React Query Only (Dynamic Data)

Best for: dashboards, editors, real-time data

```tsx
export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // poll every 30s
  })

  if (isLoading) return <Skeleton />
  return <StatsGrid data={data} />
}
```

**Pros:** Auto-revalidation, cache control, optimistic updates, devtools  
**Cons:** More boilerplate, manual loading states

### 3. Hybrid (Best of Both)

Best for: detail pages with mutations, data that's stable until user edits

```tsx
export const Route = createFileRoute('/post/$id')({
  loader: ({ params }) => fetchPost(params.id),
  component: PostEditor,
})

function PostEditor() {
  const initialData = Route.useLoaderData()
  const { id } = Route.useParams()

  // Query with loader data as initial value
  const { data: post } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    initialData, // Fast initial load from loader
  })

  // Mutations with optimistic updates
  const updateMutation = useMutation({
    mutationFn: updatePost,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['post', id] })
      const previous = queryClient.getQueryData(['post', id])
      queryClient.setQueryData(['post', id], newData)
      return { previous }
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['post', id], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] })
    },
  })

  return <Editor post={post} onSave={updateMutation.mutate} />
}
```

**Pros:** Fast initial load + full reactivity + optimistic updates  
**Cons:** Most complex setup

---

## When to Use Each

| Scenario | Recommendation |
|----------|----------------|
| Blog post view | Loader |
| Product catalog browse | Loader |
| User profile view (own) | Hybrid (view: loader, edit: query) |
| Dashboard with live stats | Query |
| Document editor | Query |
| Comments section | Query (needs add/delete/edit) |
| Settings page | Hybrid |
| Search results | Query (needs instant feedback) |
| Static marketing pages | Loader |

---

## Common Mistakes

### ❌ Using Query for everything

```tsx
// Overkill for static content
const { data } = useQuery({
  queryKey: ['about-page'],
  queryFn: fetchAboutContent,
})
```

### ✅ Use loader for static content

```tsx
export const Route = createFileRoute('/about')({
  loader: () => fetchAboutContent(),
})
```

### ❌ Using loader for frequently changing data

```tsx
// User can't see updates without page refresh
export const Route = createFileRoute('/notifications')({
  loader: () => fetchNotifications(),
})
```

### ✅ Use Query for live data

```tsx
const { data } = useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  refetchInterval: 10000,
})
```

---

## TL;DR

- **Query isn't dead** — it's now optional for read-only stable data
- **Loader:** simple, SSR-friendly, no reactivity
- **Query:** complex, reactive, optimistic updates
- **Hybrid:** fast initial + full control

When in doubt: start with loader, upgrade to hybrid when you need mutations.
