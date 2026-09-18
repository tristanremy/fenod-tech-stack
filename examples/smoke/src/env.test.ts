import { describe, expect, it } from "vitest";

import { readWorkerConfig, validateNodeEnv } from "./env.ts";

/** 32+ characters, deliberately not a placeholder-looking value. */
const GOOD_SECRET = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";

describe("validateNodeEnv", () => {
  it("accepts defaults", () => {
    expect(validateNodeEnv({})).toEqual({ NODE_ENV: "development" });
  });

  it("rejects invalid NODE_ENV", () => {
    expect(() => validateNodeEnv({ NODE_ENV: "nope" })).toThrow(/Invalid Node env/u);
  });
});

describe("readWorkerConfig", () => {
  const local = {
    APP_ENV: "development",
    BETTER_AUTH_SECRET: GOOD_SECRET,
    BETTER_AUTH_URL: "http://localhost:3000",
  };

  it("accepts a loopback development origin", () => {
    expect(readWorkerConfig(local)).toEqual({
      appEnv: "development",
      secret: GOOD_SECRET,
      origin: "http://localhost:3000",
      isLocal: true,
    });
  });

  it("accepts an https production origin", () => {
    const config = readWorkerConfig({
      ...local,
      APP_ENV: "production",
      BETTER_AUTH_URL: "https://app.example.com",
    });
    expect(config.isLocal).toBe(false);
    expect(config.origin).toBe("https://app.example.com");
  });

  it("rejects a missing or short secret", () => {
    expect(() => readWorkerConfig({ ...local, BETTER_AUTH_SECRET: undefined })).toThrow(
      /BETTER_AUTH_SECRET/u,
    );
    expect(() => readWorkerConfig({ ...local, BETTER_AUTH_SECRET: "too-short" })).toThrow(
      /BETTER_AUTH_SECRET/u,
    );
  });

  it("rejects a non-loopback origin in development", () => {
    expect(() =>
      readWorkerConfig({ ...local, BETTER_AUTH_URL: "http://192.168.1.10:3000" }),
    ).toThrow(/loopback/u);
  });

  it("rejects http, a placeholder secret or a relative URL in production", () => {
    const base = { ...local, APP_ENV: "production" };
    expect(() => readWorkerConfig({ ...base, BETTER_AUTH_URL: "http://app.example.com" })).toThrow(
      /must use https/u,
    );
    expect(() =>
      readWorkerConfig({
        ...base,
        BETTER_AUTH_URL: "https://app.example.com",
        BETTER_AUTH_SECRET: "dev-only-replace-with-long-random-string-min-32-chars",
      }),
    ).toThrow(/placeholder/u);
    expect(() => readWorkerConfig({ ...base, BETTER_AUTH_URL: "app.example.com" })).toThrow(
      /absolute URL/u,
    );
  });

  it("rejects an unknown APP_ENV", () => {
    expect(() => readWorkerConfig({ ...local, APP_ENV: "prod" })).toThrow(
      /Invalid Worker configuration/u,
    );
  });

  it("never repeats a secret value in its error messages", () => {
    const leaked = "s3cr3t-value-that-must-not-appear";
    const cases = [
      { ...local, BETTER_AUTH_SECRET: leaked.slice(0, 10) },
      {
        ...local,
        APP_ENV: "production",
        BETTER_AUTH_URL: "http://app.example.com",
        BETTER_AUTH_SECRET: leaked,
      },
    ];
    for (const config of cases) {
      let message = "";
      try {
        readWorkerConfig(config);
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      expect(message).not.toContain(leaked);
      expect(message.length).toBeGreaterThan(0);
    }
  });
});
