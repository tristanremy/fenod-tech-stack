import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

// On macOS `/tmp` and `/var` are symlinks, so an entry-point guard that compares
// a resolved argument against import.meta.url silently skips the whole check and
// exits 0. These two commands are contract checks, so a silent skip is a false
// green: the exported copy looks verified while nothing ran.
const root = resolve(import.meta.dirname, "..");

test("both contract commands run when invoked through a symlinked path", () => {
  const directory = mkdtempSync(join(tmpdir(), "fenod-cli-entry-"));
  try {
    const link = join(directory, "app");
    try {
      symlinkSync(root, link, "dir");
    } catch (error) {
      if (error.code === "EPERM" || error.code === "ENOTSUP") return;
      throw error;
    }
    const run = (script, ...args) =>
      spawnSync(process.execPath, [join(link, "scripts", script), ...args], {
        encoding: "utf8",
        timeout: 60_000,
      });

    const portable = run("check-portable.mjs");
    assert.equal(portable.status, 0);
    assert.match(portable.stdout, /Portable starter contract passed/);

    const inventory = join(directory, "secrets.json");
    writeFileSync(
      inventory,
      '[{"name":"APP_ENV"},{"name":"BETTER_AUTH_SECRET","type":"secret_text"}]',
    );
    const preflight = run("deploy-preflight.mjs", inventory);
    assert.equal(preflight.status, 0);
    assert.match(preflight.stdout, /Deploy preflight passed/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
