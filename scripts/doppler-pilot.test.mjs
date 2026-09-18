import assert from "node:assert/strict";
import test from "node:test";
import { requireToken, schemaFor, scrub, summarize } from "./doppler-pilot.mjs";

test("pilot harness stays secret-free and fails closed", () => {
  const schema = schemaFor("demo", "dev", "EXTRA=doppler()");
  assert.match(schema, /project=demo, config=dev/);
  assert.match(schema, /EXTRA=doppler\(\)/);
  assert.doesNotMatch(schema, /dp\.st\./);

  assert.deepEqual(
    summarize({
      config: {
        APP_ENV: { value: "dev" },
        BETTER_AUTH_SECRET: { value: "abcd" },
      },
    }),
    {
      names: ["APP_ENV", "BETTER_AUTH_SECRET"],
      appEnv: "dev",
      secretPresent: true,
      secretLength: 4,
      sensitive: [],
    },
  );
  assert.deepEqual(summarize({ config: { APP_ENV: { isSensitive: true } } }), {
    names: ["APP_ENV"],
    appEnv: null,
    secretPresent: false,
    secretLength: 0,
    sensitive: ["APP_ENV"],
  });

  assert.throws(() => requireToken({}), /DOPPLER_TOKEN is not set/);
  assert.throws(
    () => requireToken({ DOPPLER_TOKEN: "nope" }),
    /not a Doppler service token/,
  );
  assert.equal(
    requireToken({ DOPPLER_TOKEN: "dp.st.dev.synthetic" }),
    "dp.st.dev.synthetic",
  );

  assert.equal(
    scrub("token dp.st.dev.abcdef123456 leaked"),
    "token [token] leaked",
  );
  assert.equal(
    scrub("value aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
    "value [redacted]",
  );
  assert.equal(scrub("short abc"), "short abc");
});
