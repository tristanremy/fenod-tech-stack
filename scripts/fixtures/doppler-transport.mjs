// Test-only preload: no real HTTP transport. Used only by doppler-outage-check.mjs.
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import net from "node:net";
import { syncBuiltinESMExports } from "node:module";

const record = (event) =>
  appendFileSync(process.env.FIXTURE_TRACE, `${event}\n`);
net.Socket.prototype.connect = () => {
  record("unexpected-socket");
  throw new Error("fixture: real sockets forbidden");
};
syncBuiltinESMExports();

globalThis.fetch = async (request) => {
  const url = URL.parse(request.url);
  assert.ok(url, "fixture: invalid request URL");
  assert.equal(url.origin, "https://api.doppler.com");
  assert.equal(url.pathname, "/v3/configs/config/secrets");
  assert.equal(url.searchParams.get("project"), "fenod-starter-pilot");
  assert.equal(url.searchParams.get("config"), "dev");
  assert.equal(
    request.headers.get("authorization"),
    "Bearer dp.st.dev.synthetic-offline-fixture",
  );
  const mode = process.env.FIXTURE_MODE;
  record(mode);
  if (mode === "network") throw new TypeError("fixture-network-unavailable");
  if (mode === "timeout") {
    // Let bundled Ky's actual 10s timer fire; do not fabricate a TimeoutError.
    return new Promise((_, reject) =>
      request.signal.addEventListener(
        "abort",
        () => {
          record("timeout-aborted");
          reject(request.signal.reason);
        },
        { once: true },
      ),
    );
  }
  if (mode === "invalid-json") return new Response("not-json", { status: 200 });
  if (mode === "invalid-shape") return Response.json({ unexpected: true });
  if (mode === "unauthorized") return Response.json({}, { status: 401 });
  if (mode === "forbidden") return Response.json({}, { status: 403 });
  if (mode === "not-found") return Response.json({}, { status: 404 });
  // No Retry-After: exercises bundled Ky's own backoff instead of a long server delay.
  if (mode === "rate-limited") return Response.json({}, { status: 429 });
  if (mode === "unavailable") return Response.json({}, { status: 503 });
  assert.equal(mode, "success");
  return Response.json({
    secrets: {
      APP_ENV: { computed: "dev" },
      BETTER_AUTH_URL: { computed: "http://localhost:3000" },
      BETTER_AUTH_SECRET: {
        computed: "test-only-offline-canary-012345678901234567890123",
      },
    },
  });
};
