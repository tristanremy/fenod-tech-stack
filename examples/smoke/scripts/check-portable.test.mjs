import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { checkPortable, checkWorkflow } from "./check-portable.mjs";

const root = resolve(import.meta.dirname, "..");
test("portable checker accepts the app and rejects broken docs, scripts, names and types", () => {
  checkPortable(root);
  const temp = mkdtempSync(join(tmpdir(), "fenod-portable-"));
  try {
    for (const path of [
      "AGENTS.md",
      "README.md",
      "STACK.md",
      "package.json",
      "wrangler.jsonc",
      ".env.schema",
      "worker-configuration.d.ts",
      ".github",
    ])
      cpSync(join(root, path), join(temp, path), { recursive: true });
    const invalid = [
      ["AGENTS.md", (text) => `${text}\n[missing](./missing.md)`],
      ["README.md", (text) => `${text}\n[parent](../../docs/stack-contract.md)`],
      ["STACK.md", (text) => `${text}\nRun \`pnpm nonexistent-command\``],
      ["package.json", (text) => text.replace('"name": "fenod-smoke"', '"name": "wrong-name"')],
      ["worker-configuration.d.ts", (text) => text.replace("BETTER_AUTH_URL: string;", "")],
      [
        ".github/workflows/ci.yml",
        (text) => text.replace("GITLEAKS_DIGEST_A: c", "GITLEAKS_DIGEST_A: z"),
      ],
    ];
    for (const [file, mutate] of invalid) {
      const path = join(temp, file);
      const original = readFileSync(path, "utf8");
      writeFileSync(path, mutate(original));
      assert.throws(() => checkPortable(temp), undefined, file);
      writeFileSync(path, original);
    }
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("action policy catches both YAML uses forms and forbids privileged triggers", () => {
  const header = "permissions:\n  contents: read\npersist-credentials: false\n";
  for (const prefix of ["  uses: ", "  - uses: "]) {
    checkWorkflow(`${header}${prefix}actions/checkout@${"a".repeat(40)}`);
    assert.throws(() => checkWorkflow(`${header}${prefix}actions/checkout@v4`), /Unpinned/);
    assert.throws(
      () =>
        checkWorkflow(`${header}${prefix}actions/checkout@${"a".repeat(40)}\npull_request_target:`),
      /Privileged/,
    );
  }
});
