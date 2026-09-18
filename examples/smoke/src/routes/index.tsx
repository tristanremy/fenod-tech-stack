import { createFileRoute } from "@tanstack/react-router";

import { AuthPanel } from "#/components/auth-panel";
import { ItemList } from "#/components/item-list";
import { itemsQueryOptions } from "#/queries/items";
import { getViewer } from "#/server/items";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async ({ context }) => {
    const viewer = await getViewer();
    if (viewer) {
      // Prefetch so the first render already shows this user's own rows.
      await context.queryClient.ensureQueryData(itemsQueryOptions);
    }
    return { viewer };
  },
});

function Home() {
  const { viewer } = Route.useLoaderData();

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      {viewer ? <ItemList email={viewer.email} /> : <AuthPanel />}
    </main>
  );
}
