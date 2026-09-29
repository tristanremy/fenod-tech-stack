import { queryOptions } from "@tanstack/react-query";

import { listItems } from "#/server/items";
import { itemsQueryKey } from "./item-keys";

/** Single cache owner for the item list. Mutations invalidate this key. */
export const itemsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: itemsQueryKey(userId),
    queryFn: () => listItems(),
  });
