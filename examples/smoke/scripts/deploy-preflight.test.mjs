import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkPreflight, parseInventory, parseSchema } from "./deploy-preflight.mjs";

const SCHEMA = `# @defaultRequired=true
# ---
# @optional @sensitive @internal
DOPPLER_TOKEN=
# @type=enum(test) @public
APP_ENV=test
# @type=string(minLength=32) @sensitive
BETTER_AUTH_SECRET=
`;
const inventory = (names) => JSON.stringify(names.map((name) => ({ name, type: "secret_text" })));

test("declared and internal names are separated from the schema text", () => {
  const { declared, internal } = parseSchema(SCHEMA);
  assert.deepEqual(declared, ["APP_ENV", "BETTER_AUTH_SECRET"]);
  assert.deepEqual(internal, ["DOPPLER_TOKEN"]);
});

test("only the name and type shape is accepted as an inventory", () => {
  assert.deepEqual(parseInventory(inventory(["APP_ENV"])), ["APP_ENV"]);
  assert.throws(() => parseInventory("not json"), /not valid JSON/);
  assert.throws(() => parseInventory('{"APP_ENV":"secret-value"}'), /JSON array/);
  assert.throws(
    () => parseInventory('[{"name":"APP_ENV","type":"secret_text","value":"leaked"}]'),
    /name and optional type only/,
  );
  // Both documented shapes are accepted: with and without a type field.
  assert.deepEqual(parseInventory('[{"name":"APP_ENV"}]'), ["APP_ENV"]);
  assert.throws(() => parseInventory('[{"type":"secret_text"}]'), /needs a name field/);
  assert.throws(
    () => parseInventory('[{"name":"app-env","type":"x"}]'),
    /Unexpected inventory name/,
  );
});

test("deploy preflight accepts additions and an exact match", () => {
  const schema = parseSchema(SCHEMA);
  const exact = checkPreflight({
    ...schema,
    target: ["APP_ENV", "BETTER_AUTH_SECRET"],
  });
  assert.deepEqual(exact.create, []);
  const additive = checkPreflight({ ...schema, target: ["APP_ENV"] });
  assert.deepEqual(additive.create, ["BETTER_AUTH_SECRET"]);
});

test("Varlock's own injected bindings are kept, not treated as undeclared names", () => {
  const schema = parseSchema(SCHEMA);
  const plan = checkPreflight({
    ...schema,
    target: ["APP_ENV", "BETTER_AUTH_SECRET", "__VARLOCK_ENV", "_VARLOCK_ENV_KEY"],
  });
  assert.deepEqual(plan.artifacts, ["__VARLOCK_ENV", "_VARLOCK_ENV_KEY"]);
  assert.deepEqual(plan.blocked, []);
  assert.deepEqual(plan.remove, []);
  // Negative control: the tolerance is a fixed prefix, not a blanket allow.
  assert.throws(
    () =>
      checkPreflight({
        ...schema,
        target: ["APP_ENV", "BETTER_AUTH_SECRET", "VARLOCK_ENV"],
      }),
    /explicit --allow-remove: VARLOCK_ENV/,
  );
});

test("deploy preflight blocks unapproved removal and internal leakage", () => {
  const schema = parseSchema(SCHEMA);
  // Positive control: the same call passes once the name is declared.
  assert.doesNotThrow(() =>
    checkPreflight({ ...schema, target: ["APP_ENV", "BETTER_AUTH_SECRET"] }),
  );
  assert.throws(
    () =>
      checkPreflight({
        ...schema,
        target: ["APP_ENV", "BETTER_AUTH_SECRET", "LEGACY_DUMMY"],
      }),
    /explicit --allow-remove: LEGACY_DUMMY/,
  );
  assert.throws(
    () =>
      checkPreflight({
        ...schema,
        target: ["APP_ENV", "BETTER_AUTH_SECRET", "DOPPLER_TOKEN"],
      }),
    /never reach the target: DOPPLER_TOKEN/,
  );
  assert.throws(
    () =>
      checkPreflight({
        ...schema,
        target: ["APP_ENV", "BETTER_AUTH_SECRET"],
        allowRemove: ["NOT_IN_TARGET"],
      }),
    /names nothing that would be removed: NOT_IN_TARGET/,
  );
  const approved = checkPreflight({
    ...schema,
    target: ["APP_ENV", "BETTER_AUTH_SECRET", "LEGACY_DUMMY"],
    allowRemove: ["LEGACY_DUMMY"],
  });
  assert.deepEqual(approved.remove, ["LEGACY_DUMMY"]);
});

test("the command prints names only and fails closed", () => {
  const directory = mkdtempSync(join(tmpdir(), "fenod-deploy-preflight-"));
  try {
    const run = (...args) =>
      spawnSync(process.execPath, [join(import.meta.dirname, "deploy-preflight.mjs"), ...args], {
        cwd: directory,
        encoding: "utf8",
        timeout: 30_000,
      });
    const target = join(directory, "target.json");
    writeFileSync(target, inventory(["APP_ENV", "BETTER_AUTH_SECRET"]));
    const clean = run(target);
    assert.equal(clean.status, 0);
    assert.match(clean.stdout, /Deploy preflight passed/);
    writeFileSync(target, inventory(["APP_ENV", "BETTER_AUTH_SECRET", "LEGACY_DUMMY"]));
    const blocked = run(target);
    assert.equal(blocked.status, 1);
    assert.match(blocked.stderr, /LEGACY_DUMMY/);
    assert.doesNotMatch(blocked.stdout, /Deploy preflight passed/);
    const allowed = run(target, "--allow-remove", "LEGACY_DUMMY");
    assert.equal(allowed.status, 0);
    assert.match(allowed.stdout, /Approved removal: LEGACY_DUMMY/);
    writeFileSync(target, '[{"name":"APP_ENV","type":"x","value":"secret-value"}]');
    const leaked = run(target);
    assert.equal(leaked.status, 1);
    assert.equal(leaked.stderr.includes("secret-value"), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
