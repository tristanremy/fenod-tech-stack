import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { itemsQueryKey, otherAccountItems } from "./item-keys.ts";

// The app hard-reloads after sign-in, so the browser cannot currently switch
// accounts client-side. These tests pin the invariant that made a single shared
// key unsafe: a private list must be keyed by account and cleared on a session
// change. Reintroducing one global key fails here.
const alice = () => itemsQueryKey("alice");

function seed(client: QueryClient) {
  client.setQueryData(alice(), [{ id: 1, title: "alice row", completed: false }]);
}

describe("item list cache is scoped to the signed-in account", () => {
  it("keys the list per user id", () => {
    expect(alice()).not.toEqual(itemsQueryKey("bob"));
    expect(alice()).toEqual(["items", "alice"]);
  });

  it("drops another account's rows when the session changes", async () => {
    const client = new QueryClient();
    seed(client);
    const foreign = otherAccountItems("bob");
    await client.cancelQueries(foreign);
    client.removeQueries(foreign);
    expect(client.getQueryData(alice())).toBeUndefined();
  });

  it("keeps the current viewer's own rows", async () => {
    // Positive control for the removal above.
    const client = new QueryClient();
    const bob = itemsQueryKey("bob");
    client.setQueryData(bob, []);
    const foreign = otherAccountItems("bob");
    await client.cancelQueries(foreign);
    client.removeQueries(foreign);
    expect(client.getQueryData(bob)).toEqual([]);
  });

  it("drops every account's rows when nobody is signed in", async () => {
    const client = new QueryClient();
    seed(client);
    const bob = itemsQueryKey("bob");
    client.setQueryData(bob, []);
    const foreign = otherAccountItems(undefined);
    await client.cancelQueries(foreign);
    client.removeQueries(foreign);
    expect(client.getQueryData(alice())).toBeUndefined();
    expect(client.getQueryData(bob)).toBeUndefined();
  });
});
