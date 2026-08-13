import { describe, expect, it } from "vitest";

import { authSettings } from "./auth-settings.ts";

describe("authSettings", () => {
  it("uses a short compact cookie cache", () => {
    expect(authSettings.session.cookieCache).toEqual({
      enabled: true,
      maxAge: 5 * 60,
      strategy: "compact",
    });
  });

  it("stores Better Auth rate limits in D1, not memory", () => {
    expect(authSettings.rateLimit.storage).toBe("database");
  });

  it("trusts Cloudflare's connecting IP header", () => {
    expect(authSettings.advanced.ipAddress.ipAddressHeaders).toEqual(["cf-connecting-ip"]);
  });
});
