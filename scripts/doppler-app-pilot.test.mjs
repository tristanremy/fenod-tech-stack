import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { appSchema, runStep } from "./doppler-app-pilot.mjs";

test("pilot schema preserves dev-only, local origin, length and internal boundaries", () => {
  const live = appSchema();
  assert.match(live, /project=fenod-starter-pilot, config=dev/);
  assert.match(live, /minLength=32/);
  assert.match(live, /@sensitive @internal\nDOPPLER_TOKEN=/);
  assert.match(live, /@cache=disabled/);
  assert.match(live, /@type=enum\(dev\) @public/);
  assert.doesNotMatch(appSchema(true), /@plugin|doppler\(\)|@initDoppler/);
});

test("child failures and timeouts cannot print child diagnostics", async () => {
  const dir = mkdtempSync(join(tmpdir(), "fenod-pilot-child-test-"));
  try {
    const executable = join(dir, "pnpm");
    writeFileSync(executable, `#!${process.execPath}\nconsole.error('synthetic-private-diagnostic'); process.exit(1);\n`, { mode: 0o700 });
    await assert.rejects(runStep(dir, { PATH: dir }, [], "fixture failure"), (error) => {
      assert.doesNotMatch(error.message, /synthetic-private/);
      assert.match(error.message, /FAIL fixture failure/);
      return true;
    });
    writeFileSync(executable, `#!${process.execPath}\nsetInterval(() => {}, 1000);\n`);
    await assert.rejects(runStep(dir, { PATH: dir }, [], "fixture timeout", 100), /FAIL fixture timeout/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const varlock = resolve("examples/smoke/node_modules/.bin/varlock");
test("real Varlock validates before masking; short secret and remote origin fail", {
  skip: !existsSync(varlock) && "Install smoke dependencies to run the real Varlock integration",
}, () => {
  const dir = mkdtempSync(join(tmpdir(), "fenod-pilot-schema-test-"));
  try {
    const schema = appSchema(true);
    const run = (content) => {
      writeFileSync(join(dir, ".env.schema"), content);
      const result = spawnSync(varlock, ["load", "--path", ".env.schema", "--agent", "--format", "json-full"], {
        cwd: dir, encoding: "utf8", timeout: 30_000,
        env: { PATH: process.env.PATH, HOME: dir },
      });
      assert.equal(result.error, undefined);
      return { code: result.status, report: JSON.parse(result.stdout) };
    };
    const valid = run(schema);
    assert.equal(valid.code, 0);
    assert.equal(valid.report.config.APP_ENV.value, "dev");
    assert.equal(valid.report.config.BETTER_AUTH_SECRET.isSensitive, true);
    assert.equal(valid.report.config.DOPPLER_TOKEN, undefined);
    const short = run(schema.replace("test-only-local-doppler-app-pilot-fixture-not-a-real-secret", "short"));
    assert.notEqual(short.code, 0);
    assert.ok(short.report.errors.configItems.BETTER_AUTH_SECRET);
    const missing = run(schema.replace("test-only-local-doppler-app-pilot-fixture-not-a-real-secret", ""));
    assert.notEqual(missing.code, 0);
    assert.ok(missing.report.errors.configItems.BETTER_AUTH_SECRET);
    const remote = run(schema.replace("BETTER_AUTH_URL=http://localhost:3000", "BETTER_AUTH_URL=https://example.com"));
    assert.notEqual(remote.code, 0);
    assert.ok(remote.report.errors.configItems.BETTER_AUTH_URL);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
