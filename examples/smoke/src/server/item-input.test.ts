import { describe, expect, it } from "vitest";

import { createItemInput, itemIdInput, setItemCompletedInput } from "./item-input.ts";

const titleOf = (value: unknown) => createItemInput.safeParse(value);

describe("createItemInput", () => {
  it("trims and accepts a normal title", () => {
    const result = titleOf({ title: "  Buy milk  " });
    expect(result.success && result.data.title).toBe("Buy milk");
  });

  it("rejects a blank, whitespace-only or non-string title", () => {
    for (const value of [{ title: "" }, { title: "   " }, { title: 42 }, {}, null]) {
      expect(titleOf(value).success, JSON.stringify(value)).toBe(false);
    }
  });

  it("rejects a title longer than 200 characters", () => {
    expect(titleOf({ title: "a".repeat(200) }).success).toBe(true);
    expect(titleOf({ title: "a".repeat(201) }).success).toBe(false);
  });
});

describe("itemIdInput", () => {
  it("accepts a positive integer, including a numeric string", () => {
    expect(itemIdInput.safeParse({ id: 7 }).success).toBe(true);
    expect(itemIdInput.safeParse({ id: "7" }).success).toBe(true);
  });

  it("rejects zero, negative, fractional and non-numeric ids", () => {
    for (const id of [0, -1, 1.5, "abc", "", null, undefined]) {
      expect(itemIdInput.safeParse({ id }).success, String(id)).toBe(false);
    }
  });
});

describe("setItemCompletedInput", () => {
  it("requires a boolean flag", () => {
    expect(setItemCompletedInput.safeParse({ id: 1, completed: true }).success).toBe(true);
    expect(setItemCompletedInput.safeParse({ id: 1, completed: "true" }).success).toBe(false);
    expect(setItemCompletedInput.safeParse({ id: 1 }).success).toBe(false);
  });
});
