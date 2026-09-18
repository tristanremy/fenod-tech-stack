// Synthetic-only integration check. Registry access during install; no live Doppler access.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { appSchema } from "./doppler-app-pilot.mjs";
import { VARLOCK, DOPPLER_PLUGIN } from "./doppler-pilot.mjs";

const directory = mkdtempSync(join(tmpdir(), "fenod-doppler-outage-"));
const home = join(directory, "home");
mkdirSync(home);
// Never inherit real tokens, NODE_OPTIONS, proxies or user configuration.
const env = { PATH: process.env.PATH, HOME: home, CI: "true", DO_NOT_TRACK: "1" };
try {
  writeFileSync(join(directory, "package.json"), JSON.stringify({ private: true, type: "module" }));
  const install = spawnSync("pnpm", ["add", "--save-exact", `varlock@${VARLOCK}`, `@varlock/doppler-plugin@${DOPPLER_PLUGIN}`], {
    cwd: directory, env, stdio: "ignore", timeout: 180_000,
  });
  assert.equal(install.status, 0, "fixture dependency installation failed");
  const pkg = JSON.parse(readFileSync(join(directory, "node_modules/varlock/package.json"), "utf8"));
  const cli = join(directory, "node_modules/varlock", typeof pkg.bin === "string" ? pkg.bin : pkg.bin.varlock);
  const preload = fileURLToPath(new URL("./fixtures/doppler-transport.mjs", import.meta.url));
  const trace = join(directory, "trace.txt");
  writeFileSync(join(directory, ".env.schema"), appSchema());
  const load = (mode) => {
    writeFileSync(trace, "");
    const result = spawnSync(process.execPath, ["--import", preload, cli, "load", "--path", ".env.schema", "--agent", "--format", "json-full"], {
      cwd: directory, encoding: "utf8", timeout: 30_000,
      env: { ...env, DOPPLER_TOKEN: "dp.st.dev.synthetic-offline-fixture", FIXTURE_MODE: mode, FIXTURE_TRACE: trace },
    });
    assert.equal(result.error, undefined, `${mode}: process failed/timed out, not a valid negative result`);
    const events = readFileSync(trace, "utf8").trim().split("\n");
    assert.ok(events.includes(mode), `${mode}: must reach mocked Doppler transport`);
    assert.ok(events.every((event) => event === mode || event === "timeout-aborted"), "unexpected transport event");
    const report = JSON.parse(result.stdout);
    if (mode === "success") {
      assert.equal(result.status, 0);
      assert.equal(report.config.APP_ENV.value, "dev");
      assert.equal(report.config.BETTER_AUTH_URL.value, "http://localhost:3000");
      assert.equal(report.config.DOPPLER_TOKEN, undefined);
    } else {
      assert.notEqual(result.status, 0);
      const errors = report.errors?.configItems;
      for (const key of ["APP_ENV", "BETTER_AUTH_URL", "BETTER_AUTH_SECRET"]) {
        assert.ok(errors?.[key], `${mode}: requires a resolution error on ${key}`);
        assert.ok(!report.config?.[key]?.value, `${mode}: must not return a previous value for ${key}`);
      }
      const reason = {
        network: /fixture-network-unavailable/,
        timeout: /timed out/i,
        "invalid-json": /JSON/i,
        "invalid-shape": /undefined|null|object/i,
        unauthorized: /Authentication failed/,
        forbidden: /Access denied/,
        unavailable: /503/,
      }[mode];
      assert.match(JSON.stringify(errors), reason, `${mode}: wrong failure reason`);
      if (mode === "timeout") assert.ok(events.includes("timeout-aborted"));
    }
    process.stdout.write(`PASS ${mode}\n`);
  };
  for (const mode of ["network", "timeout", "invalid-json", "invalid-shape", "unauthorized", "forbidden", "unavailable"]) {
    // Same HOME/schema/directory across success -> failure -> recovery; new loader process each time.
    load("success");
    load(mode);
    load("success");
  }
  process.stdout.write("PASS fresh-load failure and recovery with cache disabled; running-process memory is not tested.\n");
} finally {
  rmSync(directory, { recursive: true, force: true });
}
