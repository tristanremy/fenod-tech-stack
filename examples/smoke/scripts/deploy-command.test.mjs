import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

// AR04: prove the command the pinned integration constructs, without contacting
// Cloudflare and without ever running a real deploy.
//
// Safety properties this test must itself keep:
// - The fake `wrangler` is verified first on PATH before the wrapper runs, and
//   the config path does not exist, so a fall-through to the real binary cannot
//   deploy anything.
// - The child gets a minimal allowlisted environment: no ambient deploy token,
//   vault token or user home state.
// - The fake performs the assertions in-process and writes only booleans and
//   names, so no resolved secret is ever written to disk.
// - Assertion failures report a constant message. Raw child output is never
//   interpolated into diagnostics, and both streams are scanned for the exact
//   fixture value instead of a shape guess.
const root = resolve(import.meta.dirname, "..");
const wrapper = join(root, "node_modules", ".bin", "varlock-wrangler");

// The fixture secret is committed and synthetic, so the parent may read it to
// scan child output for that exact value.
const fixtureSecret = readFileSync(join(root, ".env.schema"), "utf8").match(
  /^BETTER_AUTH_SECRET=["']?([^"'\n]+)/m,
)?.[1];
assert.equal(typeof fixtureSecret, "string");
assert.ok(fixtureSecret.length >= 32, "the fixture secret must still have a real length");

const FAKE = `#!/usr/bin/env node
const { readFileSync, statSync, writeFileSync } = require("node:fs");
const argv = process.argv.slice(2);
const at = argv.indexOf("--secrets-file");
const line = argv.join(" ");
const record = {
  // Only booleans and names leave this process.
  inheritedTokens: ["CLOUDFLARE_API_TOKEN", "DOPPLER_TOKEN"].filter((k) => process.env[k] !== undefined),
  hasSecretsFile: at !== -1,
  hasFifo: false,
  secretNames: [],
  secretLength: 0,
  secretInArgv: false,
  publicInArgv: /--var APP_ENV:\\S+/.test(line),
  keepVarsDisabled: line.includes("--keep-vars=false"),
  configArgumentPassed: false,
  blobHasConfig: false,
};
if (record.hasSecretsFile) {
  const path = argv[at + 1];
  record.hasFifo = statSync(path).isFIFO();
  const secrets = JSON.parse(readFileSync(path, "utf8"));
  record.secretNames = Object.keys(secrets).sort();
  const secret = typeof secrets.BETTER_AUTH_SECRET === "string" ? secrets.BETTER_AUTH_SECRET : "";
  record.secretLength = secret.length;
  record.secretInArgv = secret.length > 0 && line.includes(secret);
  try {
    record.blobHasConfig = typeof JSON.parse(secrets.__VARLOCK_ENV).config === "object";
  } catch {
    record.blobHasConfig = false;
  }
}
record.configArgumentPassed = argv.includes(process.env.FAKE_WRANGLER_CONFIG);
writeFileSync(process.env.FAKE_WRANGLER_OUT, JSON.stringify(record));
process.exit(Number(process.env.FAKE_WRANGLER_EXIT ?? 0));
`;

function runWrapper(extraEnv) {
  const directory = mkdtempSync(join(tmpdir(), "fenod-deploy-command-"));
  const bin = join(directory, "bin");
  const home = join(directory, "home");
  mkdirSync(bin);
  mkdirSync(home);
  const fake = join(bin, "wrangler");
  writeFileSync(fake, FAKE);
  chmodSync(fake, 0o755);

  // Allowlist only what the wrapper and Node need: no deploy token, no vault
  // token, no inherited user configuration.
  const env = {
    PATH: `${bin}:${process.env.PATH}`,
    HOME: home,
    TMPDIR: directory,
    LANG: process.env.LANG ?? "C",
    FAKE_WRANGLER_OUT: join(directory, "captured.json"),
    ...extraEnv,
  };
  // Fail closed: abort before invoking the wrapper if the fake is not first.
  const resolved = spawnSync("which", ["wrangler"], { encoding: "utf8", env });
  assert.equal(resolved.stdout.trim(), fake, "the fake wrangler must be found first");

  const absentConfig = join(directory, "absent-wrangler.json");
  env.FAKE_WRANGLER_CONFIG = absentConfig;
  const run = spawnSync(wrapper, ["deploy", "-c", absentConfig], {
    cwd: root,
    encoding: "utf8",
    timeout: 60_000,
    env,
  });
  const captured = env.FAKE_WRANGLER_OUT;
  const record = () => JSON.parse(readFileSync(captured, "utf8"));
  return {
    run,
    record,
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
    dropCapture: () => unlinkSync(captured),
  };
}

test("the pinned integration passes secrets only through a FIFO, never on the command line", () => {
  const { run, record, cleanup } = runWrapper({});
  try {
    assert.equal(run.status, 0, "the wrapper must succeed with a fake wrangler on PATH");
    const captured = record();

    // The child saw the sanitized environment, not the parent's tokens.
    assert.deepEqual(captured.inheritedTokens, []);

    // Public configuration travels as --var; the sensitive value must not.
    assert.equal(captured.publicInArgv, true, "control: a public --var should be an argument");
    assert.equal(captured.secretInArgv, false, "the sensitive value must never be an argument");
    assert.equal(captured.keepVarsDisabled, true);
    assert.equal(captured.configArgumentPassed, true);

    // The runtime blob the deployed Worker required is supplied here.
    assert.equal(captured.blobHasConfig, true);
    assert.deepEqual(captured.secretNames, ["BETTER_AUTH_SECRET", "__VARLOCK_ENV"]);
    assert.ok(captured.secretLength >= 32, "fixture secret should still be a real length");
    if (process.platform !== "win32") assert.equal(captured.hasFifo, true);

    // The wrapper reports counts, never values. Scanning for the exact fixture
    // value (not a shape guess) covers both streams.
    assert.match(run.stdout, /Deploying with varlock: 2 vars, 1 secret/);
    assert.equal(run.stdout.includes(fixtureSecret), false, "stdout must not contain the secret");
    assert.equal(run.stderr.includes(fixtureSecret), false, "stderr must not contain the secret");
  } finally {
    cleanup();
  }
});

// Negative control: a failing wrapper must stay clean too, and the test must not
// forward raw child output as its own diagnostic.
test("a failing run neither leaks the secret nor forwards raw child output", () => {
  const { run, record, cleanup } = runWrapper({ FAKE_WRANGLER_EXIT: "1" });
  try {
    assert.notEqual(run.status, 0, "the wrapper must propagate the child exit status");
    // The wrapper still resolved secrets before failing: the scan has a target.
    assert.ok(record().secretLength >= 32);
    assert.equal(run.stdout.includes(fixtureSecret), false, "stdout must not contain the secret");
    assert.equal(run.stderr.includes(fixtureSecret), false, "stderr must not contain the secret");
  } finally {
    cleanup();
  }
});
