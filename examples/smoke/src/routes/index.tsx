import { createFileRoute } from "@tanstack/react-router";

import { AuthPanel } from "#/components/auth-panel";
import { ItemList } from "#/components/item-list";
import { itemsQueryOptions } from "#/queries/items";
import { otherAccountItems } from "#/queries/item-keys";
import { getViewer } from "#/server/items";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async ({ context }) => {
    const viewer = await getViewer();
    // Cancel and drop any other account's private list before this viewer's own
    // prefetch, so a session change can never reuse cached rows.
    const foreign = otherAccountItems(viewer?.id);
    await context.queryClient.cancelQueries(foreign);
    context.queryClient.removeQueries(foreign);
    if (viewer) {
      // Prefetch so the first render already shows this user's own rows.
      await context.queryClient.ensureQueryData(itemsQueryOptions(viewer.id));
    }
    return { viewer };
  },
});

function Home() {
  const { viewer } = Route.useLoaderData();

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      {viewer ? (
        <ItemList key={viewer.id} userId={viewer.id} email={viewer.email} />
      ) : (
        <AuthPanel />
      )}
    </main>
  );
}
