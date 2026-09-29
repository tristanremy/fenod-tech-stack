/**
 * Cache-key rules for the item list, kept free of server imports so they can be
 * tested without the Workers runtime.
 */

/** Cache key for one account's item list. */
export const itemsQueryKey = (userId: string) => ["items", userId] as const;

/**
 * Every cached item list that belongs to another account. Auth in this app does
 * a full reload, so this is defence in depth: a future client-side account
 * change must never be able to render a previous user's rows.
 */
export const otherAccountItems = (viewerId?: string) => ({
  predicate: (query: { queryKey: readonly unknown[] }) =>
    query.queryKey[0] === "items" && query.queryKey[1] !== viewerId,
});
