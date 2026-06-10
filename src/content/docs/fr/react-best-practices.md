---
title: "Bonnes pratiques React"
verified: 2026-06
---

[Disponible en anglais](/fr/react-best-practices/)

> Gardez le code React simple, sécurisé, accessible et facile à modifier par des agents. Utilisez ce guide avec React Doctor avant de pousser ou fusionner des PR.

## Règles par défaut

1. Keep components small and named after product concepts.
2. Put server data in TanStack Query or route loaders, not duplicated local state.
3. Derive values during render; do not mirror props/query data into `useState` + `useEffect`.
4. Utilisez `useEffect` only for real side effects: subscriptions, imperative APIs, analytics, or external synchronization.
5. Move static config outside components: table columns, labels, nav items, schema-like arrays.
6. Memoize only when it protects expensive work or stable props for memoized children.
7. Prefer custom hooks for reusable behavior, not for hiding one-off component logic.
8. Keep forms typed with schema validation and visible labels.
9. Give icon-only buttons an `aria-label`.
10. Avoid `dangerouslySetInnerHTML`; if unavoidable, sanitize at the boundary and document why.

## Récupération de données

Prefer these patterns:

```tsx
const { data, isPending } = useQuery({
  ...orpc.companies.list.queryOptions({ input: filters }),
});
```

```tsx
const mutation = useMutation({
  ...orpc.companies.update.mutationOptions(),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.companies.key() }),
});
```

Avoid:

```tsx
const [items, setItems] = useState<Item[]>([]);

useEffect(() => {
  fetchItems().then(setItems);
}, []);
```

## Forme des composants

Good default:

```tsx
const columns: ColumnDef<User>[] = [
  { accessorKey: "email", header: "Email" },
];

export function UsersTable({ users }: { users: User[] }) {
  return <DataTable columns={columns} data={users} />;
}
```

Avoid recreating static arrays or nested components every render:

```tsx
export function UsersPage() {
  const columns = [{ accessorKey: "email", header: "Email" }];
  function RowActions() {
    return <Button>...</Button>;
  }
  return <DataTable columns={columns} />;
}
```

## Sécurité et accessibilité

- No raw HTML unless sanitized.
- No secrets in client code or `VITE_PUBLIC_*` values.
- Validate user input on the server even when forms validate on the client.
- Utilisez semantic elements before ARIA.
- Every form input needs a label or accessible name.
- Every destructive action needs a confirmation or undo path.
- External links should use `rel="noreferrer"` when opening a new tab.

## Modèle de configuration React Doctor

Add this to React app repos as `react-doctor.config.json`:

```json
{
  "lint": true,
  "deadCode": true,
  "verbose": true,
  "diff": false,
  "failOn": "error",
  "ignore": {
    "rules": [],
    "files": ["src/routeTree.gen.ts", "src/generated/**"],
    "overrides": []
  }
}
```

Only ignore rules narrowly. Prefer file-level generated-code ignores over global rule ignores.

## Commandes requises

```json
{
  "scripts": {
    "doctor:react": "react-doctor .",
    "doctor:react:diff": "react-doctor . --diff main",
    "doctor:react:staged": "react-doctor . --staged"
  }
}
```

Run before pushing UI work:

```bash
pnpm doctor:react:diff
```

Merge rule: React Doctor score should be `75+`; scores below `50` block merge unless explicitly approved.

## Checklist agent

Before handing off React work, an agent should confirm:

- [ ] no derived state in effects
- [ ] no missing effect cleanup
- [ ] no nested component definitions
- [ ] no index keys for mutable lists
- [ ] no unlabelled icon-only buttons
- [ ] no unsafe HTML or client-side secrets
- [ ] `pnpm doctor:react:diff` passes or findings are documented
