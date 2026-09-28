import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
const root = resolve(import.meta.dirname, "..");
const wrapper = join(root, "node_modules", ".bin", "varlock-wrangler");

const FAKE = `#!/usr/bin/env node
const { readFileSync, statSync, writeFileSync } = require("node:fs");
const argv = process.argv.slice(2);
const at = argv.indexOf("--secrets-file");
const line = argv.join(" ");
const record = {
  argv,
  // FAKE_WRANGLER_OUT reaching this process also proves the child env is the
  // sanitized allowlist, not the parent's.
  inheritedTokens: ["CLOUDFLARE_API_TOKEN", "DOPPLER_TOKEN"].filter((k) => process.env[k] !== undefined),
  secretsFile: at === -1 ? null : argv[at + 1],
  hasFifo: false,
  secretNames: [],
  secretLength: 0,
  secretInArgv: false,
  publicInArgv: /--var APP_ENV:\\S+/.test(line),
  blobHasConfig: false,
};
if (record.secretsFile) {
  record.hasFifo = statSync(record.secretsFile).isFIFO();
  const secrets = JSON.parse(readFileSync(record.secretsFile, "utf8"));
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
writeFileSync(process.env.FAKE_WRANGLER_OUT, JSON.stringify(record));
`;

test("the pinned integration passes secrets only through a FIFO, never on the command line", () => {
  const directory = mkdtempSync(join(tmpdir(), "fenod-deploy-command-"));
  try {
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
    };
    // Fail closed: abort before invoking the wrapper if the fake is not first.
    const resolved = spawnSync("which", ["wrangler"], { encoding: "utf8", env });
    assert.equal(resolved.stdout.trim(), fake, "the fake wrangler must be found first");

    const absentConfig = join(directory, "absent-wrangler.json");
    const run = spawnSync(wrapper, ["deploy", "-c", absentConfig], {
      cwd: root,
      encoding: "utf8",
      timeout: 60_000,
      env,
    });

    assert.equal(run.status, 0, `wrapper failed: ${run.stdout}${run.stderr}`);
    const record = JSON.parse(readFileSync(env.FAKE_WRANGLER_OUT, "utf8"));

    // The child saw the sanitized environment, not the parent's tokens.
    assert.deepEqual(record.inheritedTokens, []);

    // Public configuration travels as --var, and the sensitive value does not.
    assert.ok(record.publicInArgv, "control: a public --var value should be an argument");
    assert.equal(record.secretInArgv, false, "the sensitive value must never be an argument");
    assert.ok(record.argv.join(" ").includes("--keep-vars=false"));
    assert.ok(record.argv.join(" ").includes(`-c ${absentConfig}`));

    // The runtime blob the deployed Worker required is supplied here.
    assert.equal(record.blobHasConfig, true);
    assert.deepEqual(record.secretNames, ["BETTER_AUTH_SECRET", "__VARLOCK_ENV"]);
    assert.ok(record.secretLength >= 32, "fixture secret should still be a real length");
    if (process.platform !== "win32") assert.equal(record.hasFifo, true);

    // The wrapper reports counts, never values.
    assert.match(run.stdout, /Deploying with varlock: 2 vars, 1 secret/);
    assert.doesNotMatch(run.stdout, /[A-Za-z0-9+/]{40,}/, "output must not contain a secret");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
