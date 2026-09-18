// Local Doppler pilot harness (plan 010, S4).
//
// Run this from a terminal that the coding agent cannot inspect, with the
// read-only service token supplied through the process environment:
//
//   read -rs DOPPLER_TOKEN && export DOPPLER_TOKEN
//   node scripts/doppler-pilot.mjs
//
// The script never prints secret values. It reports names, presence and
// lengths only, and refuses to run when a token is absent.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const VARLOCK = "1.19.0";
export const DOPPLER_PLUGIN = "2.0.1";

// Declared keys are the only ones the pilot claims. `pilot-unrelated-secret`
// exists in the Doppler config but is deliberately never declared, so the
// harness can prove that undeclared keys do not reach resolved configuration.
export const DECLARED = ["APP_ENV", "BETTER_AUTH_URL", "BETTER_AUTH_SECRET"];

export function schemaFor(project, config, declarations) {
  return `# @plugin(@varlock/doppler-plugin)
# @initDoppler(project=${project}, config=${config}, serviceToken=$DOPPLER_TOKEN, cacheTtl=false)
# ---

# @type=dopplerServiceToken @sensitive @internal
DOPPLER_TOKEN=

APP_ENV=doppler()
BETTER_AUTH_URL=doppler()
# @sensitive
BETTER_AUTH_SECRET=doppler()
${declarations}
`;
}

export function summarize(report) {
  const config = report?.config ?? {};
  return {
    names: Object.keys(config).sort(),
    appEnv: config.APP_ENV?.value ?? null,
    secretPresent: typeof config.BETTER_AUTH_SECRET?.value === "string",
    secretLength: config.BETTER_AUTH_SECRET?.value?.length ?? 0,
    // The plugin marks every doppler()-sourced item sensitive by default; the
    // pilot records this because non-secret keys must stay usable downstream.
    sensitive: Object.entries(config)
      .filter(([, item]) => item?.isSensitive)
      .map(([name]) => name)
      .sort(),
  };
}

// Diagnostics must never echo a token or a resolved value.
export function scrub(text) {
  return text
    .replace(/dp\.st\.[A-Za-z0-9._-]+/g, "[token]")
    .replace(/[A-Za-z0-9_-]{32,}/g, "[redacted]");
}

function install(directory) {
  const result = spawnSync(
    "pnpm",
    ["add", `varlock@${VARLOCK}`, `@varlock/doppler-plugin@${DOPPLER_PLUGIN}`],
    { cwd: directory, stdio: ["ignore", "ignore", "pipe"], encoding: "utf8" },
  );
  assert.equal(
    result.status,
    0,
    `Dependency installation failed: ${result.stderr?.slice(0, 400)}`,
  );
}

function load(directory, schemaPath, token) {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "varlock",
      "load",
      "--path",
      schemaPath,
      "--agent",
      "--format",
      "json-full",
    ],
    {
      cwd: directory,
      encoding: "utf8",
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        DOPPLER_TOKEN: token,
      },
    },
  );
  const stdout = result.stdout ?? "";
  const start = stdout.indexOf("{");
  let report = null;
  if (start !== -1) {
    try {
      report = JSON.parse(stdout.slice(start));
    } catch {
      report = null;
    }
  }
  return { status: result.status, report, stderr: result.stderr ?? "" };
}

// The token is required but must never be echoed, logged or written to disk.
export function requireToken(env = process.env) {
  const token = env.DOPPLER_TOKEN;
  if (!token)
    throw new Error(
      "DOPPLER_TOKEN is not set. Export it in this terminal only.",
    );
  if (!token.startsWith("dp.st."))
    throw new Error("DOPPLER_TOKEN is not a Doppler service token.");
  return token;
}

function run() {
  const token = requireToken();
  const project = process.env.DOPPLER_PROJECT ?? "fenod-starter-pilot";
  const config = process.env.DOPPLER_CONFIG ?? "dev";
  const unrelated =
    process.env.DOPPLER_UNRELATED_KEY ?? "PILOT_UNRELATED_SECRET";
  const directory = mkdtempSync(join(tmpdir(), "fenod-doppler-pilot-"));
  const checks = [];
  try {
    writeFileSync(
      join(directory, "package.json"),
      JSON.stringify({ name: "pilot", private: true, type: "module" }),
    );
    install(directory);
    writeFileSync(
      join(directory, ".env.schema"),
      schemaFor(project, config, ""),
    );
    writeFileSync(
      join(directory, ".env.missing"),
      schemaFor(project, config, "PILOT_ABSENT_KEY=doppler()"),
    );

    const valid = load(directory, ".env.schema", token);
    if (valid.status !== 0) {
      // Only the plugin's own error text is shown, scrubbed of tokens and values.
      const errors = Object.values(
        valid.report?.errors?.configItems ?? {},
      ).join("\n");
      process.stdout.write(
        `\nResolution failed.\n${scrub(errors || valid.stderr)}\n`,
      );
      process.exitCode = 1;
      return;
    }
    const summary = summarize(valid.report);
    for (const name of DECLARED) {
      checks.push([`declared ${name} resolves`, summary.names.includes(name)]);
    }
    checks.push([
      "no undeclared key in resolved config",
      !summary.names.includes(unrelated),
    ]);
    checks.push([
      "internal token excluded from resolved config",
      !summary.names.includes("DOPPLER_TOKEN"),
    ]);
    checks.push([
      "sensitive value is non-empty",
      summary.secretPresent && summary.secretLength > 0,
    ]);
    checks.push([
      "secret is long enough for Better Auth (>=32)",
      summary.secretLength >= 32,
    ]);

    const rejected = load(
      directory,
      ".env.schema",
      "dp.st.dev.invalid-token-for-pilot",
    );
    checks.push([
      "invalid token fails instead of falling back",
      rejected.status !== 0,
    ]);

    const absent = load(directory, ".env.missing", token);
    checks.push(["missing declared secret fails", absent.status !== 0]);

    process.stdout.write(`\nProject/config: ${project}/${config}\n`);
    process.stdout.write(`Resolved names: ${summary.names.join(", ")}\n`);
    process.stdout.write(`Resolved APP_ENV: ${summary.appEnv}\n`);
    process.stdout.write(`Marked sensitive: ${summary.sensitive.join(", ")}\n`);
    process.stdout.write(`Secret length: ${summary.secretLength}\n\n`);
    let failed = 0;
    for (const [label, ok] of checks) {
      process.stdout.write(`${ok ? "PASS" : "FAIL"}  ${label}\n`);
      if (!ok) failed += 1;
    }
    process.stdout.write(
      `\n${checks.length - failed}/${checks.length} checks passed\n`,
    );
    process.exitCode = failed ? 1 : 0;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  run();
