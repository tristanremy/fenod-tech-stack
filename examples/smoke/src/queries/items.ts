import { queryOptions } from "@tanstack/react-query";

import { listItems } from "#/server/items";

/** Single cache owner for the item list. Mutations invalidate this key. */
export const itemsQueryOptions = queryOptions({
  queryKey: ["items"],
  queryFn: () => listItems(),
});
