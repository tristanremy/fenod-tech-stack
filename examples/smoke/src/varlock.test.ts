import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, it } from "vitest";

import { findLocalConfigConflicts } from "./config-policy.ts";

const root = resolve(import.meta.dirname, "..");
const cli = join(root, "node_modules/varlock/bin/cli.js");
const schema = readFileSync(join(root, ".env.schema"), "utf8");
const fixture = "test-only-fenod-fixture-auth-secret-not-for-deployment";
const token = "test-only-internal-token-canary-never-in-the-app";

// No ambient credentials or caches. The schema contains no network resolvers.
function run(cwd: string, args: string[], overrides: Record<string, string | undefined> = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    env: {
      PATH: process.env.PATH,
      HOME: cwd,
      CI: "true",
      DO_NOT_TRACK: "1",
      ...overrides,
      // Wrangler's ambient types claim app keys always exist; this child deliberately has none.
    } as unknown as NodeJS.ProcessEnv,
    encoding: "utf8",
    timeout: 30_000,
  });
}

it("has no Doppler resolver in fixture mode", () => {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  expect({ ...manifest.dependencies, ...manifest.devDependencies }).not.toHaveProperty(
    "@varlock/doppler-plugin",
  );
  expect(schema).not.toMatch(/@plugin|doppler\s*\(/u);
});

it("uses local fixtures, redacts diagnostics and excludes internal credentials", () => {
  const cwd = mkdtempSync(join(tmpdir(), "fenod-config-"));
  try {
    const missing = run(cwd, ["load", "--path", ".env.schema", "--agent", "--format", "json-full"]);
    expect(missing.status).not.toBe(0);
    expect(missing.stdout + missing.stderr).not.toContain(fixture);

    writeFileSync(join(cwd, ".env.schema"), schema);
    const safe = run(cwd, ["load", "--agent", "--format", "json-full"], { DOPPLER_TOKEN: token });
    expect(safe.status, safe.stderr).toBe(0);
    const graph = JSON.parse(safe.stdout);
    expect(Object.keys(graph.config).sort()).toEqual([
      "APP_ENV",
      "BETTER_AUTH_SECRET",
      "BETTER_AUTH_URL",
    ]);
    expect(graph.config.APP_ENV.value).toBe("test");
    expect(graph.config.BETTER_AUTH_SECRET.isSensitive).toBe(true);
    expect(safe.stdout + safe.stderr).not.toContain(fixture);
    expect(safe.stdout + safe.stderr).not.toContain(token);

    // Capture the raw runtime graph in memory; only fixture values may be present.
    const raw = run(cwd, ["load", "--format", "json-full"], { DOPPLER_TOKEN: token });
    expect(raw.status).toBe(0);
    expect(raw.stdout.includes(token)).toBe(false);
    expect(JSON.parse(raw.stdout).config.DOPPLER_TOKEN).toBeUndefined();
    expect(JSON.parse(raw.stdout).config.BETTER_AUTH_SECRET.value === fixture).toBe(true);

    const child = run(
      cwd,
      [
        "run",
        "--",
        process.execPath,
        "-e",
        `
      const graph = JSON.parse(process.env.__VARLOCK_ENV || '{}');
      if (process.env.DOPPLER_TOKEN !== undefined || graph.config?.DOPPLER_TOKEN !== undefined) process.exit(1);
      if (JSON.stringify(graph).includes(${JSON.stringify(token)})) process.exit(2);
      if (process.env.APP_ENV !== 'test' || !process.env.BETTER_AUTH_SECRET?.startsWith('test-only-')) process.exit(3);
      console.log('child environment verified');
    `,
      ],
      { DOPPLER_TOKEN: token },
    );
    expect(child.status, child.stderr).toBe(0);
    expect(child.stdout).toContain("child environment verified");
    expect(child.stdout + child.stderr).not.toContain(token);

    for (const invalid of [
      { APP_ENV: "production" },
      { BETTER_AUTH_SECRET: "" },
      { BETTER_AUTH_URL: "https://app.example.com" },
      { BETTER_AUTH_URL: "http://localhost:3000/path" },
    ]) {
      const result = run(cwd, ["load", "--agent", "--format", "json-full"], invalid);
      expect(result.error).toBeUndefined();
      expect(result.status).not.toBe(0);
      expect(result.stdout + result.stderr).not.toContain(fixture);
    }

    for (const secret of [
      "short-secret-canary",
      "invalid-prefix-secret-canary-long-enough-for-authentication",
    ]) {
      const result = run(cwd, ["load", "--agent", "--format", "json-full"], {
        BETTER_AUTH_SECRET: secret,
      });
      expect(result.status).not.toBe(0);
      expect(result.stdout + result.stderr).not.toContain(secret);
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}, 90_000);

it("rejects active local overrides without treating examples as runtime config", () => {
  expect(
    findLocalConfigConflicts([
      ".env.schema",
      ".env.example",
      ".dev.vars.example",
      ".env",
      ".env.local",
      ".dev.vars",
      ".dev.vars.test",
    ]),
  ).toEqual([".env", ".env.local", ".dev.vars", ".dev.vars.test"]);
});

it.each(["deploy", "db:remote"])("blocks the remote %s script", (script) => {
  const home = mkdtempSync(join(tmpdir(), "fenod-home-"));
  try {
    const result = spawnSync("pnpm", ["run", script], {
      cwd: root,
      env: {
        PATH: process.env.PATH,
        HOME: home,
        CI: "true",
        DO_NOT_TRACK: "1",
        WRANGLER_SEND_METRICS: "false",
      } as unknown as NodeJS.ProcessEnv,
      encoding: "utf8",
      timeout: 30_000,
    });
    const output = result.stdout + result.stderr;
    expect(result.status).not.toBe(0);
    expect(output).toContain("fixture-only pilot");
    expect(output).not.toContain("wrangler deploy");
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

it("fails the build scan without printing a canary", () => {
  const cwd = mkdtempSync(join(tmpdir(), "fenod-dist-"));
  try {
    writeFileSync(join(cwd, "bundle.js"), `const leaked = ${JSON.stringify(token)};`);
    const result = spawnSync(
      process.execPath,
      [join(root, "scripts/check-build-canaries.mjs"), cwd],
      {
        env: { ...process.env, DOPPLER_TOKEN: token },
        encoding: "utf8",
        timeout: 30_000,
      },
    );
    const output = result.stdout + result.stderr;
    expect(result.status).not.toBe(0);
    expect(output).toContain("internal token in bundle.js");
    expect(output).not.toContain(token);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

it("keeps internal credentials out of generated Worker bindings", () => {
  const types = readFileSync(join(root, "worker-configuration.d.ts"), "utf8");
  expect(types).toContain("APP_ENV: string");
  expect(types).toContain("BETTER_AUTH_URL: string");
  expect(types).toContain("BETTER_AUTH_SECRET: string");
  expect(types).toContain("running `varlock-wrangler types`");
  expect(types).not.toContain("varlock-types-env-");
  expect(types).not.toContain("DOPPLER_TOKEN");
});
