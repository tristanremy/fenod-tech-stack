import { describe, expect, it } from "vitest";

import { validateNodeEnv } from "./env.ts";

describe("validateNodeEnv", () => {
  it("accepts defaults", () => {
    expect(validateNodeEnv({})).toEqual({ NODE_ENV: "development" });
  });

  it("rejects invalid NODE_ENV", () => {
    expect(() => validateNodeEnv({ NODE_ENV: "nope" })).toThrow(/Invalid Node env/u);
  });
});
