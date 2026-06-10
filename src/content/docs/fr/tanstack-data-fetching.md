---
title: "Récupération de données TanStack"
verified: 2026-06
---

[Available in English](/fr/tanstack-data-fetching/)

> Avec TanStack Router/Start, React Query devient **facultatif** pour les données en lecture seule. Utilisez des chargeurs pour plus de simplicité, Query pour la réactivité.

---

## Matrice de décision

| Type de données | Utiliser | Pourquoi |
|-----------|-----|-----|
| **Stable/Statique** | Routeur `loader` | Articles de blog, pages de produits, profils – changent rarement. États de chargement/erreur intégrés. |
| **Dynamique/Mutable** | Requête de réaction | Éditeurs, flux en temps réel, données collaboratives – nécessite une invalidation du cache, des mises à jour optimistes, une récupération. |
| **Hybride** | Les deux | Chargeur pour la récupération initiale, requête pour les mutations/revalidation. |

---

## Flux de décision rapide

```
Is this data mutated frequently?
  → YES → React Query
  → NO  → Does it need background refetching?
            → YES → React Query
            → NO  → Router loader
```

---

## Modèles

### 1. Chargeur uniquement (données stables)

Idéal pour : les articles de blog, les pages statiques, les détails du produit

```

tsx
export const Route = createFileRoute('/post/$id')({
  loader: ({ params }) => fetchPost(params.id),
  component: PostPage,
})

function PostPage() {
  const post = Route.useLoaderData()
  return <article>{post.content}</article>
}
```

**Avantages :** États de chargement/erreur simples et intégrés, compatibles SSR
**Inconvénients :** Pas de revalidation automatique, pas de mises à jour optimistes

### 2. Requête React uniquement (données dynamiques)

Idéal pour : tableaux de bord, éditeurs, données en temps réel

```

tsx
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

**Avantages :** Revalidation automatique, contrôle du cache, mises à jour optimistes, outils de développement
**Inconvénients :** Plus de passe-partout, états de chargement manuel

### 3. Hybride (le meilleur des deux)

Idéal pour : les pages de détails avec des mutations, les données stables jusqu'à ce que l'utilisateur les modifie

```

tsx
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

**Avantages :** Chargement initial rapide + réactivité totale + mises à jour optimistes
**Inconvénients :** Configuration la plus complexe

---

## Quand utiliser chacun

| Scénario | Recommandation |
|--------------|----------------|
| Affichage des articles de blog | Chargeur |
| Parcourir le catalogue de produits | Chargeur |
| Vue du profil utilisateur (propre) | Hybride (vue : chargeur, édition : requête) |
| Tableau de bord avec statistiques en direct | Requête |
| Éditeur de documents | Requête |
| Section commentaires | Requête (nécessite un ajout/suppression/modification) |
| Page Paramètres | Hybride |
| Résultats de recherche | Requête (nécessite un retour instantané) |
| Pages marketing statiques | Chargeur |

---

## Erreurs courantes

### Utiliser Query pour tout

```

tsx
// Overkill for static content
const { data } = useQuery({
  queryKey: ['about-page'],
  queryFn: fetchAboutContent,
})
```

### Utiliser le chargeur pour le contenu statique

```

tsx
export const Route = createFileRoute('/about')({
  loader: () => fetchAboutContent(),
})
```

### Utilisation du chargeur pour les données qui changent fréquemment

```

tsx
// User can't see updates without page refresh
export const Route = createFileRoute('/notifications')({
  loader: () => fetchNotifications(),
})
```

### Utiliser Query pour les données en direct

```

tsx
const { data } = useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  refetchInterval: 10000,
})
```

---

## TL;DR

- **La requête n'est pas morte** — elle est désormais facultative pour les données stables en lecture seule
- **Loader :** simple, compatible SSR, aucune réactivité
- **Requête :** mises à jour complexes, réactives et optimistes
- **Hybride :** démarrage rapide + contrôle total

En cas de doute : commencez par le chargeur, passez à l'hybride lorsque vous avez besoin de mutations.
