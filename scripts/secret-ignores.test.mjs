import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..");

// Synthetic paths only. The check never creates a real secret or cache file.
const MUST_BE_IGNORED = [
  ".env.local",
  ".dev.vars",
  ".pi/subagents/example.json",
  "examples/.env.production",
  "examples/smoke/.env.local",
  "examples/smoke/.env.production",
  "examples/smoke/.dev.vars",
  "examples/smoke/.dev.vars.staging",
  "examples/smoke/.wrangler/state/cache.sqlite",
  "examples/smoke/.tanstack/tmp.json",
  "examples/astro/.env.local",
  "examples/astro/dist-preview/index.html",
];

const MUST_STAY_TRACKABLE = [
  ".pi/release.json",
  "examples/smoke/.env.example",
  "examples/smoke/.dev.vars.example",
  "examples/astro/.env.example",
];

/** Read-only: asks Git which synthetic paths its ignore rules match. */
function ignoredPaths(paths) {
  const result = spawnSync("git", ["check-ignore", "--no-index", "--stdin"], {
    cwd: repoRoot,
    encoding: "utf8",
    input: `${paths.join("\n")}\n`,
  });
  assert.ok(
    result.status === 0 || result.status === 1,
    `git check-ignore failed: ${result.stderr}`,
  );
  return new Set(result.stdout.split("\n").filter(Boolean));
}

test("secret and local-state files are ignored in every exportable example", () => {
  const ignored = ignoredPaths(MUST_BE_IGNORED);
  const missing = MUST_BE_IGNORED.filter((candidate) => !ignored.has(candidate));
  assert.deepEqual(missing, [], "these paths would be committed by mistake");
});

test("placeholder and declaration files stay trackable", () => {
  const ignored = ignoredPaths(MUST_STAY_TRACKABLE);
  const swallowed = MUST_STAY_TRACKABLE.filter((candidate) =>
    ignored.has(candidate),
  );
  assert.deepEqual(swallowed, [], "these files must remain committable");
});

test("no secret or local-state file is already tracked", () => {
  const tracked = spawnSync("git", ["ls-files"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .stdout.split("\n")
    .filter(Boolean);
  const offenders = tracked.filter(
    (file) =>
      /(^|\/)\.(env|dev\.vars)/.test(file) && !/\.(example|schema)$/.test(file),
  );
  assert.deepEqual(offenders, []);
});
