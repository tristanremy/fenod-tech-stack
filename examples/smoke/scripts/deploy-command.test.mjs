import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

// AR04: prove the command the pinned integration constructs, without contacting
// Cloudflare and without ever running a real deploy.
//
// The fake `wrangler` is placed first on PATH and must be found *before* the
// wrapper is invoked. The config path points at a file that does not exist, so
// even an unexpected fall-through to the real binary cannot deploy anything.
const root = resolve(import.meta.dirname, "..");
const wrapper = join(root, "node_modules", ".bin", "varlock-wrangler");

const FAKE = `#!/usr/bin/env node
const { readFileSync, statSync, writeFileSync } = require("node:fs");
const argv = process.argv.slice(2);
const at = argv.indexOf("--secrets-file");
const record = { argv, secretsFile: at === -1 ? null : argv[at + 1], isFifo: false };
if (record.secretsFile) {
  record.isFifo = statSync(record.secretsFile).isFIFO();
  record.secrets = JSON.parse(readFileSync(record.secretsFile, "utf8"));
}
writeFileSync(process.env.FAKE_WRANGLER_OUT, JSON.stringify(record));
`;

test("the pinned integration passes secrets only through a FIFO, never on the command line", () => {
  const directory = mkdtempSync(join(tmpdir(), "fenod-deploy-command-"));
  try {
    const bin = join(directory, "bin");
    mkdirSync(bin);
    const fake = join(bin, "wrangler");
    writeFileSync(fake, FAKE);
    chmodSync(fake, 0o755);

    const path = `${bin}:${process.env.PATH}`;
    // Fail closed: abort before invoking the wrapper if the fake is not first.
    const resolved = spawnSync("which", ["wrangler"], {
      encoding: "utf8",
      env: { ...process.env, PATH: path },
    });
    assert.equal(resolved.stdout.trim(), fake, "the fake wrangler must be found first");

    const out = join(directory, "captured.json");
    const absentConfig = join(directory, "absent-wrangler.json");
    const run = spawnSync(wrapper, ["deploy", "-c", absentConfig], {
      cwd: root,
      encoding: "utf8",
      timeout: 60_000,
      env: {
        ...process.env,
        PATH: path,
        FAKE_WRANGLER_OUT: out,
        VARLOCK_DEBUG: "",
      },
    });

    assert.equal(run.status, 0, `wrapper failed: ${run.stdout}${run.stderr}`);
    const record = JSON.parse(readFileSync(out, "utf8"));

    // Public configuration travels as --var; secrets must not.
    const line = record.argv.join(" ");
    assert.ok(line.includes("--var APP_ENV:"), line);
    assert.ok(line.includes("--var BETTER_AUTH_URL:"), line);
    assert.ok(line.includes("--keep-vars=false"), line);
    assert.ok(line.includes(`-c ${absentConfig}`), line);

    // The resolved sensitive value exists, and it is absent from the argv.
    const secret = record.secrets.BETTER_AUTH_SECRET;
    assert.equal(typeof secret, "string");
    assert.ok(secret.length >= 32, "fixture secret should still be a real length");
    assert.ok(!line.includes(secret), "the sensitive value must never be an argument");
    // Positive control: public values are on the command line, so the check
    // above is capable of failing if a sensitive value ever joins them.
    const publicValue = line.match(/--var APP_ENV:(\S+)/)?.[1];
    assert.ok(
      publicValue && line.includes(publicValue),
      "control: public --var should be an argument",
    );

    // The runtime blob the deployed Worker required is supplied here.
    assert.equal(typeof record.secrets.__VARLOCK_ENV, "string");
    const blob = JSON.parse(record.secrets.__VARLOCK_ENV);
    assert.equal(typeof blob.config, "object");

    // Name/classification split, and a FIFO rather than a file at rest.
    assert.deepEqual(Object.keys(record.secrets).sort(), ["BETTER_AUTH_SECRET", "__VARLOCK_ENV"]);
    if (process.platform !== "win32") assert.equal(record.isFifo, true);
    assert.match(run.stdout, /Deploying with varlock: 2 vars, 1 secret/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
