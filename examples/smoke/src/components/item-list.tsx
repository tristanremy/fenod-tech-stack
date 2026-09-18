import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";
import { itemsQueryOptions } from "#/queries/items";
import { createItem, deleteItem, setItemCompleted } from "#/server/items";
import type { ItemOutcome } from "#/server/items";

/** Expected boundary failures, in the user's words. */
const REASON_MESSAGE = {
  unauthenticated: "Your session expired. Sign in again to continue.",
  not_found: "That item no longer exists. The list has been refreshed.",
} as const;

export function ItemList({ email }: { email: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: items = [] } = useQuery(itemsQueryOptions);
  const [title, setTitle] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: itemsQueryOptions.queryKey });

  const settle = async (outcome: ItemOutcome<unknown>) => {
    if (outcome.ok) {
      setActionError(null);
      await refresh();
      return;
    }
    setActionError(REASON_MESSAGE[outcome.reason]);
    if (outcome.reason === "unauthenticated") {
      queryClient.clear();
      await router.invalidate();
      return;
    }
    await refresh();
  };

  const create = useMutation({
    mutationFn: (nextTitle: string) => createItem({ data: { title: nextTitle } }),
    onSuccess: async (outcome) => {
      if (outcome.ok) {
        setTitle("");
      }
      await settle(outcome);
    },
  });

  const toggle = useMutation({
    mutationFn: (input: { id: number; completed: boolean }) => setItemCompleted({ data: input }),
    onSuccess: settle,
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteItem({ data: { id } }),
    onSuccess: settle,
  });

  const signOut = async () => {
    await authClient.signOut();
    // Never leave another user's cached rows behind for the next session.
    queryClient.clear();
    await router.invalidate();
  };

  const submit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const nextTitle = title.trim();
    if (nextTitle.length > 0 && !create.isPending) {
      create.mutate(nextTitle);
    }
  };

  return (
    <section className="island-shell mx-auto max-w-2xl rounded-[2rem] px-6 py-8 sm:px-10">
      <p className="island-kicker mb-2">Your items</p>
      <h1 className="display-title mb-1 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
        Private list
      </h1>
      <p className="mb-8 text-sm text-[var(--sea-ink-soft)]">
        Signed in as {email}. Rows are scoped to your account on every query.
      </p>

      <form onSubmit={submit} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="item-title" className="sr-only">
          New item
        </label>
        <input
          id="item-title"
          type="text"
          value={title}
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add an item…"
          className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <Button type="submit" disabled={create.isPending || title.trim().length === 0}>
          {create.isPending ? "Adding…" : "Add"}
        </Button>
      </form>

      {actionError && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {actionError}
        </p>
      )}

      <ul className="m-0 list-none space-y-2 p-0">
        {items.length === 0 && (
          <li className="text-sm text-[var(--sea-ink-soft)]">No items yet.</li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
          >
            <input
              id={`item-${item.id}`}
              type="checkbox"
              checked={item.completed}
              onChange={(event) => toggle.mutate({ id: item.id, completed: event.target.checked })}
              className="size-4"
            />
            <label
              htmlFor={`item-${item.id}`}
              className={
                item.completed
                  ? "flex-1 text-sm text-[var(--sea-ink-soft)] line-through"
                  : "flex-1 text-sm text-[var(--sea-ink)]"
              }
            >
              {item.title}
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove.mutate(item.id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>

      <div className="mt-8 border-t border-[var(--line)] pt-4">
        <Button type="button" variant="outline" size="sm" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </section>
  );
}
