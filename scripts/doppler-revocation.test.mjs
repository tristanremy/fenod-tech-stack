import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { inputError, tokenStatus, verdict } from "./doppler-revocation.mjs";

test("input diagnostics distinguish missing token, malformed token and non-TTY without echoing values", () => {
  assert.match(inputError(undefined, true), /DOPPLER_TOKEN is empty/);
  assert.match(inputError("", true), /DOPPLER_TOKEN is empty/);
  assert.match(inputError("wrong-private-value", true), /service-token format/);
  assert.match(inputError(" dp.st.dev.synthetic", true), /service-token format/);
  assert.match(inputError("dp.st.dev.synthetic\n", true), /service-token format/);
  assert.match(inputError("dp.st.dev.synthetic", undefined), /stdin is not interactive/);
  assert.equal(inputError("dp.st.dev.synthetic", true), null);
  assert.doesNotMatch(inputError("wrong-private-value", true), /wrong-private-value/);
});

test("CLI reports the exact local preflight failure without contacting Doppler", () => {
  const script = fileURLToPath(new URL("./doppler-revocation.mjs", import.meta.url));
  for (const [token, expected] of [
    ["", /DOPPLER_TOKEN is empty/],
    ["synthetic-wrong-value", /service-token format/],
    ["dp.st.dev.synthetic-test-only", /stdin is not interactive/],
  ]) {
    const result = spawnSync(process.execPath, [script], {
      env: { DOPPLER_TOKEN: token }, encoding: "utf8", timeout: 5000,
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, expected);
    if (token) assert.equal(result.stderr.includes(token), false);
  }
});

test("only a positive control followed by HTTP 401 supports revocation", async () => {
  const token = "dp.st.dev.synthetic-test-only";
  for (const [status, expected] of [
    [200, "active"],
    [401, "unauthorized"],
    [400, "inconclusive"],
    [403, "inconclusive"],
    [404, "inconclusive"],
    [429, "inconclusive"],
    [500, "inconclusive"],
    [503, "inconclusive"],
    [302, "inconclusive"],
  ]) {
    let cancelled = false;
    assert.equal(
      await tokenStatus(token, async (url, options) => {
        assert.equal(url, "https://api.doppler.com/v3/me");
        assert.equal(options.method, "GET");
        assert.equal(options.headers.Authorization, `Bearer ${token}`);
        assert.equal(options.redirect, "manual");
        assert.equal(options.cache, "no-store");
        assert.ok(options.signal instanceof AbortSignal);
        return {
          status,
          body: {
            cancel: async () => {
              cancelled = true;
            },
          },
        };
      }),
      expected,
    );
    assert.equal(cancelled, true);
  }
  for (const name of ["TimeoutError", "AbortError", "TypeError"]) {
    assert.equal(
      await tokenStatus(token, async () => {
        throw Object.assign(new Error(token), { name });
      }),
      "inconclusive",
    );
  }
  assert.equal(verdict("active", "unauthorized"), true);
  for (const pair of [
    ["unauthorized", "unauthorized"],
    ["active", "active"],
    ["active", "inconclusive"],
    ["inconclusive", "unauthorized"],
  ])
    assert.equal(verdict(...pair), false);
});
