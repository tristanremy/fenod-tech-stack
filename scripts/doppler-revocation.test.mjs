import assert from "node:assert/strict";
import test from "node:test";
import { tokenStatus, verdict } from "./doppler-revocation.mjs";

test("only a positive control followed by HTTP 401 supports revocation", async () => {
  const token = "dp.st.dev.synthetic-test-only";
  for (const [status, expected] of [
    [200, "active"], [401, "unauthorized"], [400, "inconclusive"],
    [403, "inconclusive"], [404, "inconclusive"], [429, "inconclusive"],
    [500, "inconclusive"], [503, "inconclusive"], [302, "inconclusive"],
  ]) {
    let cancelled = false;
    assert.equal(await tokenStatus(token, async (url, options) => {
      assert.equal(url, "https://api.doppler.com/v3/me");
      assert.equal(options.method, "GET");
      assert.equal(options.headers.Authorization, `Bearer ${token}`);
      assert.equal(options.redirect, "manual");
      assert.equal(options.cache, "no-store");
      assert.ok(options.signal instanceof AbortSignal);
      return { status, body: { cancel: async () => { cancelled = true; } } };
    }), expected);
    assert.equal(cancelled, true);
  }
  for (const name of ["TimeoutError", "AbortError", "TypeError"]) {
    assert.equal(await tokenStatus(token, async () => {
      throw Object.assign(new Error(token), { name });
    }), "inconclusive");
  }
  assert.equal(verdict("active", "unauthorized"), true);
  for (const pair of [
    ["unauthorized", "unauthorized"], ["active", "active"],
    ["active", "inconclusive"], ["inconclusive", "unauthorized"],
  ]) assert.equal(verdict(...pair), false);
});
