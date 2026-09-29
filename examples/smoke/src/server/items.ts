import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, desc, eq } from "drizzle-orm";

import { getDb } from "#/db/index";
import { items } from "#/db/schema";
import { getSession } from "#/lib/auth";
import { createItemInput, itemIdInput, setItemCompletedInput, type Item } from "./item-input";

export type { Item };

/**
 * Expected domain failures are data, not exceptions: the client can show a
 * precise message and the agent gets a typed contract. Unexpected faults still
 * throw and surface as a server error.
 */
export type ItemOutcome<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "unauthenticated" | "not_found" };

const UNAUTHENTICATED = { ok: false, reason: "unauthenticated" } as const;
const NOT_FOUND = { ok: false, reason: "not_found" } as const;

/** Fresh read: a revoked session must not keep writing through the cookie cache. */
async function currentUserId(): Promise<string | null> {
  const session = await getSession(getRequestHeaders(), true);
  return session?.user ? session.user.id : null;
}

/** Returns the signed-in user, or `null`. Read-only, so the cookie cache is fine. */
export const getViewer = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession(getRequestHeaders());
  if (!session?.user) {
    return null;
  }
  return { id: session.user.id, name: session.user.name, email: session.user.email };
});

export const listItems = createServerFn({ method: "GET" }).handler(async (): Promise<Item[]> => {
  const userId = await currentUserId();
  if (!userId) {
    return [];
  }
  return getDb()
    .select({ id: items.id, title: items.title, completed: items.completed })
    .from(items)
    .where(eq(items.userId, userId))
    .orderBy(desc(items.createdAt), desc(items.id));
});

export const createItem = createServerFn({ method: "POST" })
  .validator((data: unknown) => createItemInput.parse(data))
  .handler(async ({ data }): Promise<ItemOutcome<Item>> => {
    const userId = await currentUserId();
    if (!userId) {
      return UNAUTHENTICATED;
    }

    const rows = await getDb()
      .insert(items)
      .values({ userId, title: data.title })
      .returning({ id: items.id, title: items.title, completed: items.completed });

    const created = rows.at(0);
    if (!created) {
      throw new Error("Insert returned no row.");
    }
    return { ok: true, value: created };
  });

/** Owner-scoped update. Another user's id matches nothing and reports not_found. */
export const setItemCompleted = createServerFn({ method: "POST" })
  .validator((data: unknown) => setItemCompletedInput.parse(data))
  .handler(async ({ data }): Promise<ItemOutcome<Item>> => {
    const userId = await currentUserId();
    if (!userId) {
      return UNAUTHENTICATED;
    }

    const rows = await getDb()
      .update(items)
      .set({ completed: data.completed })
      .where(and(eq(items.id, data.id), eq(items.userId, userId)))
      .returning({ id: items.id, title: items.title, completed: items.completed });

    const updated = rows.at(0);
    return updated ? { ok: true, value: updated } : NOT_FOUND;
  });

export const deleteItem = createServerFn({ method: "POST" })
  .validator((data: unknown) => itemIdInput.parse(data))
  .handler(async ({ data }): Promise<ItemOutcome<{ id: number }>> => {
    const userId = await currentUserId();
    if (!userId) {
      return UNAUTHENTICATED;
    }

    const rows = await getDb()
      .delete(items)
      .where(and(eq(items.id, data.id), eq(items.userId, userId)))
      .returning({ id: items.id });

    const deleted = rows.at(0);
    return deleted ? { ok: true, value: deleted } : NOT_FOUND;
  });
