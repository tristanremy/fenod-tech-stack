import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

async function signup(page: Page, email: string) {
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Need an account? Sign up" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Fixture User");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("test-only-password-12345");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Private list" })).toBeVisible();
  await page.waitForLoadState("networkidle");
}

// Use Start's actual browser transport, not a guessed /_serverFn serialization.
async function call(page: Page, operation: string, input?: unknown) {
  return page.evaluate(
    async ({ operation, input }) => {
      const modulePath = "/src/server/items.ts";
      const functions = await import(modulePath);
      return functions[operation]({ data: input });
    },
    { operation, input },
  );
}

test("real auth, owned CRUD, invalid input, cross-user denial and revoked session", async ({
  browser,
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const email = `${randomUUID()}@example.test`;
  await signup(page, email);
  await page.getByLabel("New item").fill("Only Alice can see this");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByLabel("Only Alice can see this")).toBeVisible();
  const [item] = await call(page, "listItems");
  expect(item.title).toBe("Only Alice can see this");
  await page.getByLabel(item.title).click();
  await expect.poll(async () => (await call(page, "listItems"))[0].completed).toBe(true);
  await expect(page.getByLabel(item.title)).toBeChecked();
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel(item.title)).toBeChecked();

  // A valid mutation is the positive control for malformed transport tests.
  const valid = await call(page, "createItem", { title: "transport control" });
  expect(valid.ok).toBe(true);
  await call(page, "deleteItem", { id: valid.value.id });
  const before = await call(page, "listItems");
  for (const input of [{ title: " " }, { title: "x".repeat(201) }, null]) {
    await expect(call(page, "createItem", input)).rejects.toThrow();
  }
  expect(await call(page, "listItems")).toEqual(before);

  const bobContext = await browser.newContext();
  const bob = await bobContext.newPage();
  try {
    await signup(bob, `${randomUUID()}@example.test`);
    expect(await call(bob, "listItems")).toEqual([]);
    await expect(bob.getByText(item.title, { exact: true })).toHaveCount(0);
    expect(await call(bob, "setItemCompleted", { id: item.id, completed: false })).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect(await call(bob, "deleteItem", { id: item.id })).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect(await call(page, "listItems")).toEqual(before);
  } finally {
    await bobContext.close();
  }

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("No items yet.")).toBeVisible();
  const oldCookies = await page.context().cookies();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  expect(await call(page, "createItem", { title: "anonymous" })).toEqual({
    ok: false,
    reason: "unauthenticated",
  });
  await page.context().addCookies(oldCookies);
  expect(await call(page, "createItem", { title: "revoked" })).toEqual({
    ok: false,
    reason: "unauthenticated",
  });
  expect(await call(page, "listItems")).toEqual([]);
  expect(errors).toEqual([]);
});
